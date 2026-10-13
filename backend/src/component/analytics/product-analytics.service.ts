import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductAnalyticsQueryDto } from './dto/product-analytics-query.dto';

export interface ProductLeaderboardItem {
  rank: number;
  productId: string;
  productName: string;
  categoryName: string | null;
  imageUrl: string | null;
  price: number;
  unitsSold: number;
  totalRevenue: number;
  ordersCount: number;
  percentageOfTotalSales: number;
}

export interface MonthlySalesTrendItem {
  month: string; // '2026-01'
  label: string; // 'Jan 2026'
  unitsSold: number;
  totalRevenue: number;
  ordersCount: number;
}

export interface ProductAnalyticsSummary {
  totalUnitsSold: number;
  totalRevenue: number;
  totalOrdersCount: number;
  productsCount: number;
}

export interface ProductBreakdownDetails {
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
    price: number;
    cost: number;
    stockQty: number;
    categoryName: string | null;
  };
  totalUnitsSold: number;
  totalRevenue: number;
  ordersCount: number;
  monthlyTrends: MonthlySalesTrendItem[];
}

export interface ProductAnalyticsResponse {
  timeframe: {
    startDate: string | null;
    endDate: string | null;
    limit: number | null;
  };
  summary: ProductAnalyticsSummary;
  topSellingByQuantity: ProductLeaderboardItem[];
  topSellingByRevenue: ProductLeaderboardItem[];
  monthlyTrends: MonthlySalesTrendItem[];
  productBreakdown: ProductBreakdownDetails | null;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function round3(val: number): number {
  return Math.round(val * 1000) / 1000;
}

function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

function parseBoundDate(input?: string, bound?: 'start' | 'end'): Date | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return undefined;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    if (bound === 'start') {
      d.setUTCHours(0, 0, 0, 0);
    } else if (bound === 'end') {
      d.setUTCHours(23, 59, 59, 999);
    }
  }
  return d;
}

function formatMonthLabelFromKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const monthIdx = Number(monthStr) - 1;
  if (!Number.isNaN(year) && monthIdx >= 0 && monthIdx < 12) {
    return `${MONTH_NAMES[monthIdx]} ${year}`;
  }
  return monthKey;
}

function formatDayLabelFromKey(dateKey: string): string {
  const [yearStr, monthStr, dayStr] = dateKey.split('-');
  const monthIdx = Number(monthStr) - 1;
  const day = Number(dayStr);
  if (!Number.isNaN(day) && monthIdx >= 0 && monthIdx < 12) {
    return `${day} ${MONTH_NAMES[monthIdx]}`;
  }
  return dateKey;
}

@Injectable()
export class ProductAnalyticsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getProductAnalytics(query: ProductAnalyticsQueryDto): Promise<ProductAnalyticsResponse> {
    const startDate = parseBoundDate(query.startDate, 'start');
    const endDate = parseBoundDate(query.endDate, 'end');
    const limit = query.limit && query.limit > 0 ? query.limit : null;
    const productId = query.productId?.trim() || undefined;

    const categoryId = query.categoryId?.trim() || undefined;

    // Check product existence if productId is specified
    let targetProduct: {
      id: string;
      name: string;
      imageUrl: string | null;
      price: Prisma.Decimal;
      cost: Prisma.Decimal;
      stockQty: Prisma.Decimal;
      category: { name: string } | null;
    } | null = null;

    if (productId) {
      targetProduct = await this.prismaService.posProduct.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          price: true,
          cost: true,
          stockQty: true,
          category: { select: { name: true } },
        },
      });
      if (!targetProduct) {
        throw new NotFoundException(`Product with ID "${productId}" not found`);
      }
    }

    // Build SQL WHERE conditions safely with Prisma.sql
    const posWhereClauses: Prisma.Sql[] = [
      Prisma.sql`pol."productId" IS NOT NULL`,
      Prisma.sql`po."status" IN ('PAID', 'REFUND')`,
    ];
    const saleWhereClauses: Prisma.Sql[] = [
      Prisma.sql`sol."productId" IS NOT NULL`,
      Prisma.sql`so."status" = 'CONFIRMED'`,
      Prisma.sql`so."deletedAt" IS NULL`,
    ];

    if (startDate) {
      posWhereClauses.push(Prisma.sql`po."createdAt" >= ${startDate}`);
      saleWhereClauses.push(Prisma.sql`so."orderDate" >= ${startDate}`);
    }
    if (endDate) {
      posWhereClauses.push(Prisma.sql`po."createdAt" <= ${endDate}`);
      saleWhereClauses.push(Prisma.sql`so."orderDate" <= ${endDate}`);
    }
    if (productId) {
      posWhereClauses.push(Prisma.sql`pol."productId" = ${productId}`);
      saleWhereClauses.push(Prisma.sql`sol."productId" = ${productId}`);
    }
    if (categoryId) {
      posWhereClauses.push(Prisma.sql`p."categoryId" = ${categoryId}`);
      saleWhereClauses.push(Prisma.sql`p."categoryId" = ${categoryId}`);
    }

    const posWhere = Prisma.join(posWhereClauses, ' AND ');
    const saleWhere = Prisma.join(saleWhereClauses, ' AND ');

    // Optimized Common Table Expression uniting POS and Confirmed Sale Orders
    const salesCte = Prisma.sql`
      WITH product_sales AS (
        SELECT
          pol."productId" AS "productId",
          COALESCE(p."name", pol."productName") AS "productName",
          p."imageUrl" AS "imageUrl",
          COALESCE(p."price", pol."unitPrice")::numeric AS "currentPrice",
          c."name" AS "categoryName",
          pol."quantity"::numeric AS "quantity",
          pol."total"::numeric AS "revenue",
          po."createdAt" AS "orderDate",
          po."id" AS "orderId"
        FROM "PosOrderLine" pol
        JOIN "PosOrder" po ON po."id" = pol."orderId"
        LEFT JOIN "PosProduct" p ON p."id" = pol."productId"
        LEFT JOIN "PosCategory" c ON c."id" = p."categoryId"
        WHERE ${posWhere}

        UNION ALL

        SELECT
          sol."productId" AS "productId",
          COALESCE(p."name", sol."productName") AS "productName",
          p."imageUrl" AS "imageUrl",
          COALESCE(p."price", sol."unitPrice")::numeric AS "currentPrice",
          c."name" AS "categoryName",
          sol."quantity"::numeric AS "quantity",
          sol."total"::numeric AS "revenue",
          so."orderDate" AS "orderDate",
          so."id" AS "orderId"
        FROM "SaleOrderLine" sol
        JOIN "SaleOrder" so ON so."id" = sol."saleOrderId"
        LEFT JOIN "PosProduct" p ON p."id" = sol."productId"
        LEFT JOIN "PosCategory" c ON c."id" = p."categoryId"
        WHERE ${saleWhere}
      )
    `;

    // 1. Overall Summary
    const summaryQuery = Prisma.sql`
      ${salesCte}
      SELECT
        COALESCE(SUM("quantity"), 0)::numeric AS "totalUnitsSold",
        COALESCE(SUM("revenue"), 0)::numeric AS "totalRevenue",
        COUNT(DISTINCT "orderId")::int AS "totalOrdersCount",
        COUNT(DISTINCT "productId")::int AS "productsCount"
      FROM product_sales
    `;

    // 2. Aggregated Products for Ranked Leaderboard
    const productsQuery = Prisma.sql`
      ${salesCte}
      SELECT
        "productId",
        "productName",
        "imageUrl",
        "currentPrice"::numeric AS "price",
        "categoryName",
        COALESCE(SUM("quantity"), 0)::numeric AS "unitsSold",
        COALESCE(SUM("revenue"), 0)::numeric AS "totalRevenue",
        COUNT(DISTINCT "orderId")::int AS "ordersCount"
      FROM product_sales
      GROUP BY "productId", "productName", "imageUrl", "currentPrice", "categoryName"
      HAVING SUM("quantity") > 0
    `;

    // 3. Trends Query (Day or Month)
    const isDaily =
      query.interval === 'day' ||
      (query.interval !== 'month' &&
        !!startDate &&
        !!endDate &&
        endDate.getTime() - startDate.getTime() <= 35 * 86400 * 1000);

    const trendsQuery = isDaily
      ? Prisma.sql`
          ${salesCte}
          SELECT
            TO_CHAR(DATE_TRUNC('day', "orderDate"), 'YYYY-MM-DD') AS "period",
            DATE_TRUNC('day', "orderDate") AS "periodDate",
            COALESCE(SUM("quantity"), 0)::numeric AS "unitsSold",
            COALESCE(SUM("revenue"), 0)::numeric AS "totalRevenue",
            COUNT(DISTINCT "orderId")::int AS "ordersCount"
          FROM product_sales
          GROUP BY DATE_TRUNC('day', "orderDate"), TO_CHAR(DATE_TRUNC('day', "orderDate"), 'YYYY-MM-DD')
          ORDER BY "periodDate" ASC
        `
      : Prisma.sql`
          ${salesCte}
          SELECT
            TO_CHAR(DATE_TRUNC('month', "orderDate"), 'YYYY-MM') AS "period",
            DATE_TRUNC('month', "orderDate") AS "periodDate",
            COALESCE(SUM("quantity"), 0)::numeric AS "unitsSold",
            COALESCE(SUM("revenue"), 0)::numeric AS "totalRevenue",
            COUNT(DISTINCT "orderId")::int AS "ordersCount"
          FROM product_sales
          GROUP BY DATE_TRUNC('month', "orderDate"), TO_CHAR(DATE_TRUNC('month', "orderDate"), 'YYYY-MM')
          ORDER BY "periodDate" ASC
        `;

    // Execute queries in parallel
    const [summaryRows, productRows, trendRows] = await Promise.all([
      this.prismaService.$queryRaw<
        Array<{
          totalUnitsSold: number | string | null;
          totalRevenue: number | string | null;
          totalOrdersCount: number | null;
          productsCount: number | null;
        }>
      >(summaryQuery),
      this.prismaService.$queryRaw<
        Array<{
          productId: string;
          productName: string;
          imageUrl: string | null;
          price: number | string | null;
          categoryName: string | null;
          unitsSold: number | string | null;
          totalRevenue: number | string | null;
          ordersCount: number | null;
        }>
      >(productsQuery),
      this.prismaService.$queryRaw<
        Array<{
          period: string;
          periodDate: Date;
          unitsSold: number | string | null;
          totalRevenue: number | string | null;
          ordersCount: number | null;
        }>
      >(trendsQuery),
    ]);

    const rawSummary = summaryRows[0];
    const totalUnitsSold = round3(Number(rawSummary?.totalUnitsSold ?? 0));
    const totalRevenue = round3(Number(rawSummary?.totalRevenue ?? 0));
    const totalOrdersCount = Number(rawSummary?.totalOrdersCount ?? 0);
    const productsCount = Number(rawSummary?.productsCount ?? 0);

    const summary: ProductAnalyticsSummary = {
      totalUnitsSold,
      totalRevenue,
      totalOrdersCount,
      productsCount,
    };

    // Parse and normalize product rows
    const normalizedProducts = productRows.map((row) => {
      const units = round3(Number(row.unitsSold ?? 0));
      const rev = round3(Number(row.totalRevenue ?? 0));
      const pct = totalRevenue > 0 ? round2((rev / totalRevenue) * 100) : 0;
      return {
        productId: row.productId,
        productName: row.productName,
        categoryName: row.categoryName,
        imageUrl: row.imageUrl,
        price: round3(Number(row.price ?? 0)),
        unitsSold: units,
        totalRevenue: rev,
        ordersCount: Number(row.ordersCount ?? 0),
        percentageOfTotalSales: pct,
      };
    });

    // Ranked by Quantity Sold
    const sortedByQuantity = [...normalizedProducts].sort((a, b) => {
      if (b.unitsSold !== a.unitsSold) return b.unitsSold - a.unitsSold;
      return b.totalRevenue - a.totalRevenue;
    });
    const topSellingByQuantity: ProductLeaderboardItem[] = (
      limit ? sortedByQuantity.slice(0, limit) : sortedByQuantity
    ).map((item, idx) => ({ ...item, rank: idx + 1 }));

    // Ranked by Revenue Generated
    const sortedByRevenue = [...normalizedProducts].sort((a, b) => {
      if (b.totalRevenue !== a.totalRevenue) return b.totalRevenue - a.totalRevenue;
      return b.unitsSold - a.unitsSold;
    });
    const topSellingByRevenue: ProductLeaderboardItem[] = (
      limit ? sortedByRevenue.slice(0, limit) : sortedByRevenue
    ).map((item, idx) => ({ ...item, rank: idx + 1 }));

    // Parse Trends (Day or Month)
    let monthlyTrends: MonthlySalesTrendItem[] = [];

    if (isDaily) {
      const periodMap = new Map<
        string,
        { unitsSold: number; totalRevenue: number; ordersCount: number }
      >();
      for (const row of trendRows) {
        periodMap.set(row.period, {
          unitsSold: round3(Number(row.unitsSold ?? 0)),
          totalRevenue: round3(Number(row.totalRevenue ?? 0)),
          ordersCount: Number(row.ordersCount ?? 0),
        });
      }

      // Generate all consecutive days for the date range
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 86400 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      const endUtc = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

      while (cur <= endUtc) {
        const yyyy = cur.getUTCFullYear();
        const mm = String(cur.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(cur.getUTCDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;
        const existing = periodMap.get(key);

        monthlyTrends.push({
          month: key,
          label: formatDayLabelFromKey(key),
          unitsSold: existing ? existing.unitsSold : 0,
          totalRevenue: existing ? existing.totalRevenue : 0,
          ordersCount: existing ? existing.ordersCount : 0,
        });

        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    } else {
      monthlyTrends = trendRows.map((row) => ({
        month: row.period,
        label: formatMonthLabelFromKey(row.period),
        unitsSold: round3(Number(row.unitsSold ?? 0)),
        totalRevenue: round3(Number(row.totalRevenue ?? 0)),
        ordersCount: Number(row.ordersCount ?? 0),
      }));
    }

    // Product Breakdown if targetProduct is selected
    let productBreakdown: ProductBreakdownDetails | null = null;
    if (targetProduct) {
      productBreakdown = {
        product: {
          id: targetProduct.id,
          name: targetProduct.name,
          imageUrl: targetProduct.imageUrl,
          price: round3(Number(targetProduct.price)),
          cost: round3(Number(targetProduct.cost)),
          stockQty: round3(Number(targetProduct.stockQty)),
          categoryName: targetProduct.category?.name ?? null,
        },
        totalUnitsSold,
        totalRevenue,
        ordersCount: totalOrdersCount,
        monthlyTrends,
      };
    }

    return {
      timeframe: {
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        limit: limit ?? normalizedProducts.length,
      },
      summary,
      topSellingByQuantity,
      topSellingByRevenue,
      monthlyTrends,
      productBreakdown,
    };
  }
}
