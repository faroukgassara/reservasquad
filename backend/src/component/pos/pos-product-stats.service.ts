import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PosCatalogService } from './pos-catalog.service';
import { round3, toTunisDayKey } from './pos.utils';

export interface ProductStatsRange {
  startDate?: string;
  endDate?: string;
}

interface MarginTotals {
  unitsSold: number;
  revenue: number;
  ordersCount: number;
  /** Margin over the lines whose cost was known; null when none was. */
  margin: number | null;
  marginPct: number | null;
  costOfSales: number;
  /** Share of the revenue whose cost is known (0-100); null without sales. */
  costCoveragePct: number | null;
}

interface MarginRow {
  unitsSold: number | string | null;
  revenue: number | string | null;
  ordersCount: number | null;
  knownRevenue: number | string | null;
  knownCost: number | string | null;
  knownLines: number | null;
}

const MAX_BULK_IDS = 100;
const SESSION_TREND_MAX_DAYS = 35;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function toMarginTotals(row: MarginRow | undefined): MarginTotals {
  const revenue = round3(Number(row?.revenue ?? 0));
  const knownRevenue = round3(Number(row?.knownRevenue ?? 0));
  const knownCost = round3(Number(row?.knownCost ?? 0));
  const margin = Number(row?.knownLines ?? 0) > 0 ? round3(knownRevenue - knownCost) : null;
  return {
    unitsSold: round3(Number(row?.unitsSold ?? 0)),
    revenue,
    ordersCount: Number(row?.ordersCount ?? 0),
    margin,
    marginPct: margin !== null && knownRevenue !== 0 ? round2((margin / knownRevenue) * 100) : null,
    costOfSales: knownCost,
    costCoveragePct: revenue !== 0 ? round2(Math.min(100, (knownRevenue / revenue) * 100)) : null,
  };
}

function dayLabel(dayKey: string): string {
  const [, month, day] = dayKey.split('-').map(Number);
  return `${day} ${MONTH_NAMES[month - 1] ?? ''}`.trim();
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return `${MONTH_NAMES[month - 1] ?? ''} ${year}`.trim();
}

/**
 * Product sales statistics with margins. Same scope as Sales Analytics: paid/refunded register orders
 * of closed sessions, dated on the Tunisian day the session closed. Margins use the cost frozen on
 * each sale line, so a later cost change never rewrites past figures.
 */
@Injectable()
export class PosProductStatsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly catalogService: PosCatalogService,
  ) {}

  private closeDay = Prisma.sql`(ps."closedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Tunis')`;

  private salesWhere(range: ProductStatsRange, productFilter: Prisma.Sql): Prisma.Sql {
    const clauses: Prisma.Sql[] = [
      Prisma.sql`ps."status" = 'CLOSED'`,
      Prisma.sql`po."status" IN ('PAID', 'REFUND')`,
      productFilter,
    ];
    const startDay = toTunisDayKey(range.startDate);
    const endDay = toTunisDayKey(range.endDate);
    if (startDay) clauses.push(Prisma.sql`${this.closeDay}::date >= ${startDay}::date`);
    if (endDay) clauses.push(Prisma.sql`${this.closeDay}::date <= ${endDay}::date`);
    return Prisma.join(clauses, ' AND ');
  }

  private marginColumns = Prisma.sql`
    COALESCE(SUM(pol."quantity"), 0)::numeric AS "unitsSold",
    COALESCE(SUM(pol."total"), 0)::numeric AS "revenue",
    COUNT(DISTINCT po."id")::int AS "ordersCount",
    COALESCE(SUM(CASE WHEN pol."unitCost" IS NOT NULL THEN pol."total" END), 0)::numeric AS "knownRevenue",
    COALESCE(SUM(CASE WHEN pol."unitCost" IS NOT NULL THEN pol."quantity" * pol."unitCost" END), 0)::numeric AS "knownCost",
    COUNT(pol."unitCost")::int AS "knownLines"
  `;

  private salesFrom = Prisma.sql`
    FROM "PosOrderLine" pol
    JOIN "PosOrder" po ON po."id" = pol."orderId"
    JOIN "PosSession" ps ON ps."id" = po."sessionId"
  `;

  private async loadSales(range: ProductStatsRange, productFilter: Prisma.Sql) {
    const where = this.salesWhere(range, productFilter);

    const startDay = toTunisDayKey(range.startDate);
    const endDay = toTunisDayKey(range.endDate);
    const perSession =
      !!startDay &&
      !!endDay &&
      (Date.parse(endDay) - Date.parse(startDay)) / 86_400_000 <= SESSION_TREND_MAX_DAYS;

    const trendQuery = perSession
      ? Prisma.sql`
          SELECT ps."id" AS "period", ps."number" AS "sessionNumber",
                 TO_CHAR(MAX(${this.closeDay}), 'YYYY-MM-DD') AS "closeDay",
                 ${this.marginColumns}
          ${this.salesFrom}
          WHERE ${where}
          GROUP BY ps."id", ps."number"
          ORDER BY MAX(ps."closedAt") ASC`
      : Prisma.sql`
          SELECT TO_CHAR(DATE_TRUNC('month', ${this.closeDay}), 'YYYY-MM') AS "period",
                 ${this.marginColumns}
          ${this.salesFrom}
          WHERE ${where}
          GROUP BY 1
          ORDER BY 1 ASC`;

    const [summaryRows, trendRows] = await Promise.all([
      this.prismaService.$queryRaw<MarginRow[]>(Prisma.sql`
        SELECT ${this.marginColumns}
        ${this.salesFrom}
        WHERE ${where}`),
      this.prismaService.$queryRaw<Array<MarginRow & { period: string; sessionNumber?: number; closeDay?: string }>>(
        trendQuery,
      ),
    ]);

    const sales = toMarginTotals(summaryRows[0]);
    return {
      granularity: perSession ? ('session' as const) : ('month' as const),
      sales: {
        ...sales,
        avgSellingPrice: sales.unitsSold > 0 ? round3(sales.revenue / sales.unitsSold) : null,
      },
      trend: trendRows.map((row) => {
        const totals = toMarginTotals(row);
        return {
          key: row.period,
          label:
            perSession && row.closeDay
              ? `#${row.sessionNumber} · ${dayLabel(row.closeDay)}`
              : monthLabel(row.period),
          unitsSold: totals.unitsSold,
          revenue: totals.revenue,
          margin: totals.margin,
        };
      }),
    };
  }

  async getProductStats(id: string, range: ProductStatsRange) {
    const product = await this.catalogService.getProductById(id);
    const { granularity, sales, trend } = await this.loadSales(range, Prisma.sql`pol."productId" = ${id}`);

    const [purchases, lastPurchase, stock] = await Promise.all([
      this.prismaService.$queryRaw<
        Array<{ bought: number | string | null; costedQty: number | string | null; totalSpent: number | string | null }>
      >(Prisma.sql`
        SELECT
          COALESCE(SUM("quantity"), 0)::numeric AS "bought",
          COALESCE(SUM(CASE WHEN "unitCost" > 0 THEN "quantity" END), 0)::numeric AS "costedQty",
          COALESCE(SUM(CASE WHEN "unitCost" > 0 THEN "quantity" * "unitCost" END), 0)::numeric AS "totalSpent"
        FROM "PosStockEntry"
        WHERE "productId" = ${id}`),
      this.prismaService.posStockEntry.findFirst({
        where: { productId: id, unitCost: { gt: 0 } },
        orderBy: { createdAt: 'desc' },
        select: { unitCost: true, createdAt: true },
      }),
      this.catalogService.getStockMovements(id),
    ]);

    const costedQty = Number(purchases[0]?.costedQty ?? 0);
    const totalSpent = round3(Number(purchases[0]?.totalSpent ?? 0));
    const currentCost = Number(product.cost);

    return {
      granularity,
      sales,
      trend,
      purchases: {
        bought: round3(Number(purchases[0]?.bought ?? 0)),
        totalSpent,
        avgPurchaseCost: costedQty > 0 ? round3(totalSpent / costedQty) : null,
        lastPurchaseCost: lastPurchase ? round3(Number(lastPurchase.unitCost)) : null,
        lastPurchaseAt: lastPurchase?.createdAt.toISOString() ?? null,
      },
      stock: {
        stock: stock.stock,
        sold: stock.sold,
        currentCost: currentCost > 0 ? round3(currentCost) : null,
      },
    };
  }

  /** Aggregate figures over every product of a category (or the whole catalogue when no category is given). */
  async getCatalogStats(range: ProductStatsRange, categoryId?: string) {
    const scope = categoryId
      ? Prisma.sql`SELECT "id" FROM "PosProduct" WHERE "categoryId" = ${categoryId} AND "deletedAt" IS NULL`
      : Prisma.sql`SELECT "id" FROM "PosProduct" WHERE "deletedAt" IS NULL`;

    const { granularity, sales, trend } = await this.loadSales(range, Prisma.sql`pol."productId" IN (${scope})`);

    const [purchases, soldRows, stockRows] = await Promise.all([
      this.prismaService.$queryRaw<
        Array<{ bought: number | string | null; costedQty: number | string | null; totalSpent: number | string | null }>
      >(Prisma.sql`
        SELECT
          COALESCE(SUM("quantity"), 0)::numeric AS "bought",
          COALESCE(SUM(CASE WHEN "unitCost" > 0 THEN "quantity" END), 0)::numeric AS "costedQty",
          COALESCE(SUM(CASE WHEN "unitCost" > 0 THEN "quantity" * "unitCost" END), 0)::numeric AS "totalSpent"
        FROM "PosStockEntry"
        WHERE "productId" IN (${scope})`),
      this.prismaService.$queryRaw<Array<{ sold: number | string | null }>>(Prisma.sql`
        SELECT COALESCE(SUM(pol."quantity"), 0)::numeric AS "sold"
        FROM "PosOrderLine" pol
        JOIN "PosOrder" po ON po."id" = pol."orderId"
        WHERE pol."productId" IN (${scope}) AND po."status" IN ('PAID', 'REFUND')`),
      this.prismaService.posProduct.aggregate({
        where: { deletedAt: null, ...(categoryId ? { categoryId } : {}) },
        _sum: { stockQty: true },
      }),
    ]);

    const costedQty = Number(purchases[0]?.costedQty ?? 0);
    const totalSpent = round3(Number(purchases[0]?.totalSpent ?? 0));

    return {
      granularity,
      sales,
      trend,
      purchases: {
        bought: round3(Number(purchases[0]?.bought ?? 0)),
        totalSpent,
        avgPurchaseCost: costedQty > 0 ? round3(totalSpent / costedQty) : null,
        lastPurchaseCost: null,
        lastPurchaseAt: null,
      },
      stock: {
        stock: round3(Number(stockRows._sum.stockQty ?? 0)),
        sold: round3(Number(soldRows[0]?.sold ?? 0)),
        currentCost: null,
      },
    };
  }

  /** Compact per-product figures for the products list. */
  async getProductsStats(idsParam: string | undefined, range: ProductStatsRange) {
    const ids = [...new Set((idsParam ?? '').split(',').map((id) => id.trim()).filter(Boolean))];
    if (ids.length === 0) return [];
    if (ids.length > MAX_BULK_IDS) throw new BadRequestException(`At most ${MAX_BULK_IDS} products at once`);

    const where = this.salesWhere(range, Prisma.sql`pol."productId" IN (${Prisma.join(ids)})`);
    const rows = await this.prismaService.$queryRaw<Array<MarginRow & { productId: string }>>(Prisma.sql`
      SELECT pol."productId" AS "productId", ${this.marginColumns}
      ${this.salesFrom}
      WHERE ${where}
      GROUP BY pol."productId"`);

    return rows.map((row) => {
      const totals = toMarginTotals(row);
      return {
        productId: row.productId,
        unitsSold: totals.unitsSold,
        revenue: totals.revenue,
        margin: totals.margin,
        marginPct: totals.marginPct,
        costCoveragePct: totals.costCoveragePct,
      };
    });
  }
}
