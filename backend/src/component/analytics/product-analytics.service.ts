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
  month: string; // '2026-01', or the session id when grouped per session
  label: string; // 'Jan 2026' or '#569 · 1 Oct'
  unitsSold: number;
  totalRevenue: number;
  ordersCount: number;
  sessionNumber?: number;
  openedAt?: string;
  closedAt?: string;
}

export interface ProductAnalyticsSummary {
  totalUnitsSold: number;
  totalRevenue: number;
  totalOrdersCount: number;
  productsCount: number;
  sessionsCount: number;
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
    granularity: 'session' | 'month';
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

    // Every figure comes from closed Caisse sessions and is dated by the session's closing time.
    const sessionWhereClauses: Prisma.Sql[] = [Prisma.sql`ps."status" = 'CLOSED'`];
    if (startDate) sessionWhereClauses.push(Prisma.sql`ps."closedAt" >= ${startDate}`);
    if (endDate) sessionWhereClauses.push(Prisma.sql`ps."closedAt" <= ${endDate}`);

    const lineWhereClauses: Prisma.Sql[] = [
      ...sessionWhereClauses,
      Prisma.sql`pol."productId" IS NOT NULL`,
      Prisma.sql`po."status" IN ('PAID', 'REFUND')`,
    ];
    if (productId) lineWhereClauses.push(Prisma.sql`pol."productId" = ${productId}`);
    if (categoryId) lineWhereClauses.push(Prisma.sql`p."categoryId" = ${categoryId}`);

    // Collected cash cannot be split per product, so a product/category filter falls back to line totals.
    const useLineRevenue = Boolean(productId || categoryId);

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
          ps."closedAt" AS "saleDate",
          ps."id" AS "sessionId",
          po."id" AS "orderId"
        FROM "PosOrderLine" pol
        JOIN "PosOrder" po ON po."id" = pol."orderId"
        JOIN "PosSession" ps ON ps."id" = po."sessionId"
        LEFT JOIN "PosProduct" p ON p."id" = pol."productId"
        LEFT JOIN "PosCategory" c ON c."id" = p."categoryId"
        WHERE ${Prisma.join(lineWhereClauses, ' AND ')}
      )
    `;

    // Same formula as the session closing summary: cash (minus change given) + bank payments.
    const sessionRevenueCte = Prisma.sql`
      WITH session_revenue AS (
        SELECT
          ps."id" AS "sessionId",
          ps."number" AS "sessionNumber",
          ps."openedAt" AS "openedAt",
          ps."closedAt" AS "saleDate",
          (
            COALESCE((
              SELECT SUM(pp."amount")
              FROM "PosPayment" pp
              JOIN "PosOrder" o ON o."id" = pp."orderId"
              WHERE o."sessionId" = ps."id" AND pp."method" IN ('CASH', 'BANK')
            ), 0)
            - COALESCE((SELECT SUM(o."change") FROM "PosOrder" o WHERE o."sessionId" = ps."id"), 0)
          )::numeric AS "revenue"
        FROM "PosSession" ps
        WHERE ${Prisma.join(sessionWhereClauses, ' AND ')}
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

    const sessionSummaryQuery = Prisma.sql`
      ${sessionRevenueCte}
      SELECT
        COALESCE(SUM("revenue"), 0)::numeric AS "totalRevenue",
        COUNT(*)::int AS "sessionsCount"
      FROM session_revenue
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

    // 3. Trends: one point per closed session for short ranges, one point per closing month otherwise
    const perSession =
      query.interval === 'day' ||
      (query.interval !== 'month' &&
        !!startDate &&
        !!endDate &&
        endDate.getTime() - startDate.getTime() <= 35 * 86400 * 1000);

    const periodKey = perSession
      ? Prisma.sql`"sessionId"`
      : Prisma.sql`TO_CHAR(DATE_TRUNC('month', "saleDate"), 'YYYY-MM')`;

    const trendsQuery = Prisma.sql`
      ${salesCte}
      SELECT
        ${periodKey} AS "period",
        COALESCE(SUM("quantity"), 0)::numeric AS "unitsSold",
        COALESCE(SUM("revenue"), 0)::numeric AS "totalRevenue",
        COUNT(DISTINCT "orderId")::int AS "ordersCount"
      FROM product_sales
      GROUP BY 1
    `;

    const sessionTrendsQuery = Prisma.sql`
      ${sessionRevenueCte}
      SELECT
        ${periodKey} AS "period",
        MIN("sessionNumber")::int AS "sessionNumber",
        MIN("openedAt") AS "openedAt",
        MAX("saleDate") AS "closedAt",
        COALESCE(SUM("revenue"), 0)::numeric AS "totalRevenue"
      FROM session_revenue
      GROUP BY 1
      ORDER BY MAX("saleDate") ASC
    `;

    // Execute queries in parallel
    const [summaryRows, sessionSummaryRows, productRows, trendRows, sessionTrendRows] = await Promise.all([
      this.prismaService.$queryRaw<
        Array<{
          totalUnitsSold: number | string | null;
          totalRevenue: number | string | null;
          totalOrdersCount: number | null;
          productsCount: number | null;
        }>
      >(summaryQuery),
      this.prismaService.$queryRaw<
        Array<{ totalRevenue: number | string | null; sessionsCount: number | null }>
      >(sessionSummaryQuery),
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
          unitsSold: number | string | null;
          totalRevenue: number | string | null;
          ordersCount: number | null;
        }>
      >(trendsQuery),
      this.prismaService.$queryRaw<
        Array<{
          period: string;
          sessionNumber: number;
          openedAt: Date;
          closedAt: Date;
          totalRevenue: number | string | null;
        }>
      >(sessionTrendsQuery),
    ]);

    const rawSummary = summaryRows[0];
    const totalUnitsSold = round3(Number(rawSummary?.totalUnitsSold ?? 0));
    const lineRevenue = round3(Number(rawSummary?.totalRevenue ?? 0));
    const totalOrdersCount = Number(rawSummary?.totalOrdersCount ?? 0);
    const productsCount = Number(rawSummary?.productsCount ?? 0);
    const sessionRevenue = round3(Number(sessionSummaryRows[0]?.totalRevenue ?? 0));
    const sessionsCount = Number(sessionSummaryRows[0]?.sessionsCount ?? 0);
    const totalRevenue = useLineRevenue ? lineRevenue : sessionRevenue;

    const summary: ProductAnalyticsSummary = {
      totalUnitsSold,
      totalRevenue,
      totalOrdersCount,
      productsCount,
      sessionsCount,
    };

    // Parse and normalize product rows
    const normalizedProducts = productRows.map((row) => {
      const units = round3(Number(row.unitsSold ?? 0));
      const rev = round3(Number(row.totalRevenue ?? 0));
      const pct = lineRevenue > 0 ? round2((rev / lineRevenue) * 100) : 0;
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

    // Parse Trends: units/orders from product lines, amounts from collected session revenue
    const linePeriods = new Map(
      trendRows.map((row) => [
        row.period,
        {
          unitsSold: round3(Number(row.unitsSold ?? 0)),
          lineRevenue: round3(Number(row.totalRevenue ?? 0)),
          ordersCount: Number(row.ordersCount ?? 0),
        },
      ]),
    );
    const sessionPeriods = new Map(sessionTrendRows.map((row) => [row.period, row]));

    const trendItem = (key: string, label: string): MonthlySalesTrendItem => {
      const line = linePeriods.get(key);
      const session = sessionPeriods.get(key);
      return {
        month: key,
        label,
        unitsSold: line?.unitsSold ?? 0,
        totalRevenue: useLineRevenue ? (line?.lineRevenue ?? 0) : round3(Number(session?.totalRevenue ?? 0)),
        ordersCount: line?.ordersCount ?? 0,
      };
    };

    const monthlyTrends: MonthlySalesTrendItem[] = perSession
      ? sessionTrendRows.map((row) => ({
          ...trendItem(
            row.period,
            `#${row.sessionNumber} · ${formatDayLabelFromKey(new Date(row.closedAt).toISOString().slice(0, 10))}`,
          ),
          sessionNumber: row.sessionNumber,
          openedAt: new Date(row.openedAt).toISOString(),
          closedAt: new Date(row.closedAt).toISOString(),
        }))
      : [...new Set([...linePeriods.keys(), ...sessionPeriods.keys()])]
          .sort()
          .map((key) => trendItem(key, formatMonthLabelFromKey(key)));

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
        granularity: perSession ? 'session' : 'month',
      },
      summary,
      topSellingByQuantity,
      topSellingByRevenue,
      monthlyTrends,
      productBreakdown,
    };
  }
}
