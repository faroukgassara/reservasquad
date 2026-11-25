import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDailyIncomeDto } from 'src/dto/dailyIncome/createDailyIncome.dto';
import { UpdateDailyIncomeDto } from 'src/dto/dailyIncome/updateDailyIncome.dto';
import {
  FetchDailyIncomeDto,
  type DailyIncomeScope,
} from 'src/dto/dailyIncome/fetchDailyIncome.dto';
import {
  CreateIncomeLineDto,
  UpdateIncomeLineDto,
} from 'src/dto/dailyIncome/createIncomeLine.dto';
import {
  CreateChargeCategoryDto,
  UpdateChargeCategoryDto,
} from 'src/dto/dailyIncome/chargeCategory.dto';
import { FetchIncomeLinesDto } from 'src/dto/dailyIncome/fetchIncomeLines.dto';
import { SetPreviousMonthRestDto } from 'src/dto/dailyIncome/setPreviousMonthRest.dto';
import { UpdateDailyIncomeSettingsDto } from 'src/dto/dailyIncome/dailyIncomeSettings.dto';
import { EIncomeLineType, Prisma } from 'src/generated/prisma/client';
import { AuditService } from '../audit/audit.service';
import { formatAuditDate, formatAuditMoney } from 'src/common/utils/audit-format.util';

const incomeLineInclude = {
  category: { select: { id: true, name: true } },
} as const;

function incomeLineTypeLabel(type: EIncomeLineType): string {
  switch (type) {
    case 'CHARGE':
      return 'Charge';
    case 'INVESTMENT':
      return 'Investissement';
    case 'ECOFACTURE':
      return 'Écofacture';
    case 'FAROUK':
      return 'Farouk';
    case 'MAJDI':
      return 'Majdi';
    default:
      return type;
  }
}

function incomeLineDisplayLabel(line: {
  type: EIncomeLineType;
  description: string | null;
  category?: { name: string } | null;
}): string {
  if (line.type === EIncomeLineType.CHARGE) {
    const categoryName = line.category?.name?.trim();
    if (categoryName && line.description?.trim()) {
      return `${categoryName} — ${line.description.trim()}`;
    }
    return categoryName || line.description?.trim() || '—';
  }
  return line.description?.trim() || '—';
}

@Injectable()
export class DailyIncomeService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private toDateOnly(value: string | Date): Date {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException('Invalid date');
    }
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  private dateKey(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private calcPercent(totalIncome: number, rate: number): string {
    return Math.round(totalIncome * rate).toFixed(2);
  }

  async getSettings() {
    let settings = await this.prismaService.dailyIncomeSettings.findUnique({
      where: { id: 'default' },
    });
    if (!settings) {
      settings = await this.prismaService.dailyIncomeSettings.create({
        data: { id: 'default' },
      });
    }
    return {
      chargesPercentage: Number(settings.chargesPercentage),
      savingsPercentage: Number(settings.savingsPercentage),
      benefitsPercentage: Number(settings.benefitsPercentage),
      savingsForChargesPercentage: Number(settings.savingsForChargesPercentage),
      updatedAt: settings.updatedAt,
    };
  }

  async updateSettings(dto: UpdateDailyIncomeSettingsDto, actorId?: string) {
    const total =
      Number(dto.chargesPercentage) +
      Number(dto.savingsPercentage) +
      Number(dto.benefitsPercentage) +
      Number(dto.savingsForChargesPercentage);

    if (Math.abs(total - 100) > 0.01) {
      throw new BadRequestException('The sum of all percentages must equal 100%');
    }

    const updated = await this.prismaService.dailyIncomeSettings.upsert({
      where: { id: 'default' },
      update: {
        chargesPercentage: dto.chargesPercentage,
        savingsPercentage: dto.savingsPercentage,
        benefitsPercentage: dto.benefitsPercentage,
        savingsForChargesPercentage: dto.savingsForChargesPercentage,
        updatedById: actorId || null,
      },
      create: {
        id: 'default',
        chargesPercentage: dto.chargesPercentage,
        savingsPercentage: dto.savingsPercentage,
        benefitsPercentage: dto.benefitsPercentage,
        savingsForChargesPercentage: dto.savingsForChargesPercentage,
        updatedById: actorId || null,
      },
    });

    await this.auditService.log({
      entityType: 'DAILY_INCOME',
      entityId: 'settings',
      action: 'UPDATE',
      userId: actorId,
      summary: `Mise à jour des pourcentages des revenus journaliers (Charges: ${dto.chargesPercentage}%, Épargne: ${dto.savingsPercentage}%, Bénéfices: ${dto.benefitsPercentage}%, Écofacture: ${dto.savingsForChargesPercentage}%)`,
      metadata: {
        chargesPercentage: dto.chargesPercentage,
        savingsPercentage: dto.savingsPercentage,
        benefitsPercentage: dto.benefitsPercentage,
        savingsForChargesPercentage: dto.savingsForChargesPercentage,
      },
    });

    return {
      chargesPercentage: Number(updated.chargesPercentage),
      savingsPercentage: Number(updated.savingsPercentage),
      benefitsPercentage: Number(updated.benefitsPercentage),
      savingsForChargesPercentage: Number(updated.savingsForChargesPercentage),
      updatedAt: updated.updatedAt,
    };
  }

  private calcShares(
    totalIncome: number,
    settings?: {
      savingsPercentage?: number;
      benefitsPercentage?: number;
      savingsForChargesPercentage?: number;
    },
  ) {
    const savingsRate = (settings?.savingsPercentage ?? 20) / 100;
    const benefitsRate = (settings?.benefitsPercentage ?? 20) / 100;
    const savingsForChargesRate = (settings?.savingsForChargesPercentage ?? 10) / 100;
    return {
      savings: this.calcPercent(totalIncome, savingsRate),
      benefits: this.calcPercent(totalIncome, benefitsRate),
      savingsForCharges: this.calcPercent(totalIncome, savingsForChargesRate),
    };
  }

  private monthRange(year: number, month: number): { from: Date; to: Date } {
    const from = new Date(Date.UTC(year, month - 1, 1));
    const to = new Date(Date.UTC(year, month, 1));
    return { from, to };
  }

  private resolvePeriod(query: { year?: number; month?: number; scope?: DailyIncomeScope }) {
    const now = new Date();
    const year = query.year ?? now.getUTCFullYear();
    const month = query.month ?? now.getUTCMonth() + 1;
    const isGlobal = query.scope === 'all';
    const { from, to } = this.monthRange(year, month);
    return {
      year,
      month,
      isGlobal,
      dateFilter: isGlobal ? undefined : { gte: from, lt: to },
    };
  }

  async createDailyIncome(dto: CreateDailyIncomeDto, actorId?: string) {
    const date = this.toDateOnly(dto.date);
    const existing = await this.prismaService.dailyIncome.findFirst({
      where: { date, deletedAt: null, posSessionId: null },
    });
    if (existing) {
      throw new ConflictException('A daily income entry already exists for this date');
    }

    const settings = await this.getSettings();
    const totalIncome = Number(dto.totalIncome);
    const shares = this.calcShares(totalIncome, settings);
    const created = await this.prismaService.dailyIncome.create({
      data: {
        date,
        totalIncome: totalIncome.toFixed(2),
        savings: shares.savings,
        benefits: shares.benefits,
        savingsForCharges: shares.savingsForCharges,
        notes: dto.notes?.trim() || null,
      },
    });

    const summary = `Revenu journalier enregistré pour le ${formatAuditDate(created.date)} · Total : ${formatAuditMoney(created.totalIncome)} (Épargne : ${formatAuditMoney(created.savings)}, Bénéfices : ${formatAuditMoney(created.benefits)}, Charges : ${formatAuditMoney(created.savingsForCharges)})`;

    await this.auditService.log({
      entityType: 'DAILY_INCOME',
      entityId: created.id,
      action: 'CREATE',
      userId: actorId,
      summary,
      metadata: {
        date: created.date,
        totalIncome: Number(created.totalIncome),
        savings: Number(created.savings),
        benefits: Number(created.benefits),
        savingsForCharges: Number(created.savingsForCharges),
      },
    });

    return created;
  }

  /** Each closed register session gets its own entry, dated on its closing day, alongside the day's manual entry. */
  async createForSession(
    tx: Prisma.TransactionClient,
    posSessionId: string,
    value: Date,
    amount: number,
  ) {
    const settings = await this.getSettings();
    const totalIncome = Math.round(amount * 100) / 100;
    return tx.dailyIncome.create({
      data: {
        date: this.toDateOnly(value),
        totalIncome: totalIncome.toFixed(2),
        ...this.calcShares(totalIncome, settings),
        posSessionId,
      },
    });
  }

  async updateDailyIncome(
    id: string,
    dto: UpdateDailyIncomeDto,
    actorId?: string,
  ) {
    const existing = await this.getDailyIncomeById(id);

    let date = existing.date;
    if (dto.date !== undefined) {
      date = this.toDateOnly(dto.date);
      const conflict =
        !existing.posSessionId &&
        (await this.prismaService.dailyIncome.findFirst({
          where: { date, deletedAt: null, posSessionId: null, id: { not: id } },
        }));
      if (conflict) {
        throw new ConflictException('A daily income entry already exists for this date');
      }
    }

    const settings = await this.getSettings();
    const totalIncome =
      dto.totalIncome !== undefined ? Number(dto.totalIncome) : Number(existing.totalIncome);
    const shares = this.calcShares(totalIncome, settings);

    const updated = await this.prismaService.dailyIncome.update({
      where: { id },
      data: {
        date,
        totalIncome: totalIncome.toFixed(2),
        savings: shares.savings,
        benefits: shares.benefits,
        savingsForCharges: shares.savingsForCharges,
        ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null }),
      },
    });

    const summary = `Revenu journalier modifié pour le ${formatAuditDate(updated.date)} · Total : ${formatAuditMoney(updated.totalIncome)} (Épargne : ${formatAuditMoney(updated.savings)}, Bénéfices : ${formatAuditMoney(updated.benefits)}, Charges : ${formatAuditMoney(updated.savingsForCharges)})`;

    await this.auditService.log({
      entityType: 'DAILY_INCOME',
      entityId: updated.id,
      action: 'UPDATE',
      userId: actorId,
      summary,
      metadata: {
        date: updated.date,
        totalIncome: Number(updated.totalIncome),
        savings: Number(updated.savings),
        benefits: Number(updated.benefits),
        savingsForCharges: Number(updated.savingsForCharges),
      },
    });

    return updated;
  }

  async getDailyIncomeById(id: string) {
    const row = await this.prismaService.dailyIncome.findFirst({
      where: { id, deletedAt: null },
    });
    if (!row) throw new NotFoundException('Daily income not found');
    return row;
  }

  async deleteDailyIncome(id: string, actorId?: string) {
    await this.getDailyIncomeById(id);
    const deleted = await this.prismaService.dailyIncome.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    const summary = `Revenu journalier supprimé pour le ${formatAuditDate(deleted.date)} · Total : ${formatAuditMoney(deleted.totalIncome)}`;

    await this.auditService.log({
      entityType: 'DAILY_INCOME',
      entityId: deleted.id,
      action: 'DELETE',
      userId: actorId,
      summary,
      metadata: {
        date: deleted.date,
        totalIncome: Number(deleted.totalIncome),
      },
    });

    return deleted;
  }

  async listDailyIncomes(query: FetchDailyIncomeDto) {
    const { dateFilter, year, month } = this.resolvePeriod(query);

    const days = await this.prismaService.dailyIncome.findMany({
      where: { deletedAt: null, date: dateFilter },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: { posSession: { select: { number: true } } },
    });

    const lines = await this.prismaService.incomeLine.findMany({
      where: {
        deletedAt: null,
        date: dateFilter,
        type: { in: [EIncomeLineType.CHARGE, EIncomeLineType.INVESTMENT] },
      },
      select: { date: true, amount: true, type: true },
    });

    const linesByDay = new Map<string, { charges: number; investments: number }>();
    for (const line of lines) {
      const key = this.dateKey(line.date);
      const bucket = linesByDay.get(key) ?? { charges: 0, investments: 0 };
      const amount = Number(line.amount);
      if (line.type === EIncomeLineType.CHARGE) bucket.charges += amount;
      else bucket.investments += amount;
      linesByDay.set(key, bucket);
    }

    // Several entries can share a date (manual + register sessions): the day's lines go on the first one only.
    const seenDays = new Set<string>();
    const data = days.map((day) => {
      const key = this.dateKey(day.date);
      const bucket = (!seenDays.has(key) && linesByDay.get(key)) || { charges: 0, investments: 0 };
      seenDays.add(key);
      const chargesInvestment = Math.round((bucket.charges + bucket.investments) * 100) / 100;
      return {
        ...day,
        charges: Math.round(bucket.charges * 100) / 100,
        investments: Math.round(bucket.investments * 100) / 100,
        chargesInvestment,
      };
    });

    return { year, month, data };
  }

  async getSummary(query: FetchDailyIncomeDto) {
    const { dateFilter, year, month, isGlobal } = this.resolvePeriod(query);

    const [incomeAgg, lineTotals, carryover] = await Promise.all([
      this.prismaService.dailyIncome.aggregate({
        where: { deletedAt: null, date: dateFilter },
        _sum: { totalIncome: true, savings: true, benefits: true, savingsForCharges: true },
      }),
      this.prismaService.incomeLine.groupBy({
        by: ['type'],
        where: { deletedAt: null, date: dateFilter },
        _sum: { amount: true },
      }),
      isGlobal
        ? null
        : this.prismaService.monthlyCarryover.findUnique({
            where: { year_month: { year, month } },
          }),
    ]);

    const lineTotal = (type: EIncomeLineType) =>
      Number(lineTotals.find((row) => row.type === type)?._sum.amount ?? 0);

    const totalIncome = Number(incomeAgg._sum.totalIncome ?? 0);
    const totalSavings = Number(incomeAgg._sum.savings ?? 0);
    const totalBenefits = Number(incomeAgg._sum.benefits ?? 0);
    const totalSavingsForCharges = Number(incomeAgg._sum.savingsForCharges ?? 0);
    const totalCharges = lineTotal(EIncomeLineType.CHARGE);
    const totalInvestments = lineTotal(EIncomeLineType.INVESTMENT);
    const totalEcofactureExpenses = lineTotal(EIncomeLineType.ECOFACTURE);
    const totalFarouk = lineTotal(EIncomeLineType.FAROUK);
    const totalMajdi = lineTotal(EIncomeLineType.MAJDI);
    const totalBenefitWithdrawals = totalFarouk + totalMajdi;
    // Écofacture lines come out of the 10% reserve and Farouk/Majdi lines out of the benefits,
    // so they reduce those totals and not the net balance.
    const netBalance =
      Math.round(
        (totalIncome -
          totalCharges -
          totalInvestments -
          totalSavings -
          totalBenefits -
          totalSavingsForCharges) *
          100,
      ) / 100;

    return {
      year,
      month,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalCharges: Math.round(totalCharges * 100) / 100,
      totalInvestments: Math.round(totalInvestments * 100) / 100,
      totalSavings: Math.round(totalSavings * 100) / 100,
      totalBenefits: Math.round((totalBenefits - totalBenefitWithdrawals) * 100) / 100,
      totalFarouk: Math.round(totalFarouk * 100) / 100,
      totalMajdi: Math.round(totalMajdi * 100) / 100,
      totalSavingsForCharges:
        Math.round((totalSavingsForCharges - totalEcofactureExpenses) * 100) / 100,
      totalEcofactureExpenses: Math.round(totalEcofactureExpenses * 100) / 100,
      netBalance,
      previousMonthRest: carryover ? Number(carryover.amount) : 0,
    };
  }

  async setPreviousMonthRest(dto: SetPreviousMonthRestDto, actorId?: string) {
    const amount = Number(dto.amount).toFixed(2);
    const saved = await this.prismaService.monthlyCarryover.upsert({
      where: { year_month: { year: dto.year, month: dto.month } },
      create: { year: dto.year, month: dto.month, amount },
      update: { amount },
    });

    const periodLabel = `${String(dto.month).padStart(2, '0')}/${dto.year}`;
    const summary = `Reste du mois précédent défini pour ${periodLabel} : ${formatAuditMoney(amount)}`;

    await this.auditService.log({
      entityType: 'DAILY_INCOME',
      entityId: saved.id,
      action: 'UPDATE',
      userId: actorId,
      summary,
      metadata: {
        year: dto.year,
        month: dto.month,
        amount,
      },
    });

    return saved;
  }

  async getTrend(months: number) {
    const now = new Date();
    const count = Math.min(Math.max(Math.trunc(months) || 6, 1), 24);
    const periods = Array.from({ length: count }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });

    const earliest = new Date(Date.UTC(periods[0].year, periods[0].month - 1, 1));
    const latest = new Date(Date.UTC(periods[count - 1].year, periods[count - 1].month, 1));

    const [dailyIncomes, incomeLines, carryovers] = await Promise.all([
      this.prismaService.dailyIncome.findMany({
        where: {
          deletedAt: null,
          date: { gte: earliest, lt: latest },
        },
        select: {
          date: true,
          totalIncome: true,
          savings: true,
          benefits: true,
          savingsForCharges: true,
        },
      }),
      this.prismaService.incomeLine.findMany({
        where: {
          deletedAt: null,
          date: { gte: earliest, lt: latest },
        },
        select: {
          date: true,
          type: true,
          amount: true,
        },
      }),
      this.prismaService.monthlyCarryover.findMany({
        where: {
          OR: periods.map((p) => ({ year: p.year, month: p.month })),
        },
      }),
    ]);

    const carryoverMap = new Map<string, number>();
    for (const c of carryovers) {
      carryoverMap.set(`${c.year}-${c.month}`, Number(c.amount));
    }

    return periods.map((period) => {
      const { from, to } = this.monthRange(period.year, period.month);
      const fromTime = from.getTime();
      const toTime = to.getTime();

      let totalIncome = 0;
      let totalSavings = 0;
      let totalBenefits = 0;
      let totalSavingsForCharges = 0;

      for (const d of dailyIncomes) {
        const t = d.date.getTime();
        if (t >= fromTime && t < toTime) {
          totalIncome += Number(d.totalIncome);
          totalSavings += Number(d.savings);
          totalBenefits += Number(d.benefits);
          totalSavingsForCharges += Number(d.savingsForCharges);
        }
      }

      let totalCharges = 0;
      let totalInvestments = 0;
      let totalEcofactureExpenses = 0;
      let totalFarouk = 0;
      let totalMajdi = 0;

      for (const l of incomeLines) {
        const t = l.date.getTime();
        if (t >= fromTime && t < toTime) {
          const amount = Number(l.amount);
          switch (l.type) {
            case EIncomeLineType.CHARGE:
              totalCharges += amount;
              break;
            case EIncomeLineType.INVESTMENT:
              totalInvestments += amount;
              break;
            case EIncomeLineType.ECOFACTURE:
              totalEcofactureExpenses += amount;
              break;
            case EIncomeLineType.FAROUK:
              totalFarouk += amount;
              break;
            case EIncomeLineType.MAJDI:
              totalMajdi += amount;
              break;
          }
        }
      }

      const totalBenefitWithdrawals = totalFarouk + totalMajdi;
      const netBalance =
        Math.round(
          (totalIncome -
            totalCharges -
            totalInvestments -
            totalSavings -
            totalBenefits -
            totalSavingsForCharges) *
            100,
        ) / 100;

      return {
        year: period.year,
        month: period.month,
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalCharges: Math.round(totalCharges * 100) / 100,
        totalInvestments: Math.round(totalInvestments * 100) / 100,
        totalSavings: Math.round(totalSavings * 100) / 100,
        totalBenefits: Math.round((totalBenefits - totalBenefitWithdrawals) * 100) / 100,
        totalFarouk: Math.round(totalFarouk * 100) / 100,
        totalMajdi: Math.round(totalMajdi * 100) / 100,
        totalSavingsForCharges:
          Math.round((totalSavingsForCharges - totalEcofactureExpenses) * 100) / 100,
        netBalance,
        previousMonthRest: carryoverMap.get(`${period.year}-${period.month}`) ?? 0,
      };
    });
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (value === undefined || value === null) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private async assertChargeCategory(categoryId: string) {
    const category = await this.prismaService.chargeCategory.findFirst({
      where: { id: categoryId, deletedAt: null },
    });
    if (!category) throw new NotFoundException('Charge category not found');
    return category;
  }

  private async resolveIncomeLineCategory(params: {
    type: EIncomeLineType;
    categoryId?: string | null;
  }): Promise<string | null> {
    if (params.type !== EIncomeLineType.CHARGE) {
      return null;
    }
    if (!params.categoryId) {
      throw new BadRequestException('categoryId is required for CHARGE lines');
    }
    await this.assertChargeCategory(params.categoryId);
    return params.categoryId;
  }

  async listChargeCategories() {
    return this.prismaService.chargeCategory.findMany({
      where: { deletedAt: null },
      orderBy: [{ name: 'asc' }],
    });
  }

  async createChargeCategory(dto: CreateChargeCategoryDto, actorId?: string) {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Name is required');

    const existing = await this.prismaService.chargeCategory.findFirst({
      where: {
        deletedAt: null,
        name: { equals: name, mode: 'insensitive' },
      },
    });
    if (existing) throw new ConflictException('A charge category with this name already exists');

    const created = await this.prismaService.chargeCategory.create({
      data: { name },
    });

    await this.auditService.log({
      entityType: 'CHARGE_CATEGORY',
      entityId: created.id,
      action: 'CREATE',
      userId: actorId,
      summary: `Catégorie de charge créée : "${created.name}"`,
      metadata: { name: created.name },
    });

    return created;
  }

  async updateChargeCategory(
    id: string,
    dto: UpdateChargeCategoryDto,
    actorId?: string,
  ) {
    const current = await this.prismaService.chargeCategory.findFirst({
      where: { id, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Charge category not found');

    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('Name is required');

    const duplicate = await this.prismaService.chargeCategory.findFirst({
      where: {
        deletedAt: null,
        id: { not: id },
        name: { equals: name, mode: 'insensitive' },
      },
    });
    if (duplicate) throw new ConflictException('A charge category with this name already exists');

    const updated = await this.prismaService.chargeCategory.update({
      where: { id },
      data: { name },
    });

    await this.auditService.log({
      entityType: 'CHARGE_CATEGORY',
      entityId: updated.id,
      action: 'UPDATE',
      userId: actorId,
      summary: `Catégorie de charge modifiée : "${current.name}" → "${updated.name}"`,
      metadata: { previousName: current.name, name: updated.name },
    });

    return updated;
  }

  async deleteChargeCategory(id: string, actorId?: string) {
    const current = await this.prismaService.chargeCategory.findFirst({
      where: { id, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Charge category not found');

    const deleted = await this.prismaService.chargeCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      entityType: 'CHARGE_CATEGORY',
      entityId: deleted.id,
      action: 'DELETE',
      userId: actorId,
      summary: `Catégorie de charge supprimée : "${deleted.name}"`,
      metadata: { name: deleted.name },
    });

    return deleted;
  }

  async createIncomeLine(dto: CreateIncomeLineDto, actorId?: string) {
    const date = this.toDateOnly(dto.date);
    const categoryId = await this.resolveIncomeLineCategory({
      type: dto.type,
      categoryId: dto.categoryId,
    });
    const description = this.normalizeOptionalText(dto.description);

    const created = await this.prismaService.incomeLine.create({
      data: {
        date,
        type: dto.type,
        description,
        categoryId,
        amount: Number(dto.amount).toFixed(2),
      },
      include: incomeLineInclude,
    });

    const typeLabel = incomeLineTypeLabel(created.type);
    const display = incomeLineDisplayLabel(created);
    const summary = `Ligne de revenu créée [${typeLabel}] : "${display}" · Montant : ${formatAuditMoney(created.amount)} · Date : ${formatAuditDate(created.date)}`;

    await this.auditService.log({
      entityType: 'INCOME_LINE',
      entityId: created.id,
      action: 'CREATE',
      userId: actorId,
      summary,
      metadata: {
        type: created.type,
        description: created.description,
        categoryId: created.categoryId,
        categoryName: created.category?.name ?? null,
        amount: Number(created.amount),
        date: created.date,
      },
    });

    return created;
  }

  async updateIncomeLine(
    id: string,
    dto: UpdateIncomeLineDto,
    actorId?: string,
  ) {
    const current = await this.getIncomeLineById(id);
    const nextType = dto.type ?? current.type;
    const nextCategoryId =
      dto.categoryId !== undefined
        ? dto.categoryId
        : current.categoryId;

    const categoryId = await this.resolveIncomeLineCategory({
      type: nextType,
      categoryId: nextCategoryId,
    });

    const updated = await this.prismaService.incomeLine.update({
      where: { id },
      data: {
        ...(dto.date !== undefined && { date: this.toDateOnly(dto.date) }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.description !== undefined && {
          description: this.normalizeOptionalText(dto.description),
        }),
        categoryId,
        ...(dto.amount !== undefined && { amount: Number(dto.amount).toFixed(2) }),
      },
      include: incomeLineInclude,
    });

    const typeLabel = incomeLineTypeLabel(updated.type);
    const display = incomeLineDisplayLabel(updated);
    const summary = `Ligne de revenu modifiée [${typeLabel}] : "${display}" · Montant : ${formatAuditMoney(updated.amount)} · Date : ${formatAuditDate(updated.date)}`;

    await this.auditService.log({
      entityType: 'INCOME_LINE',
      entityId: updated.id,
      action: 'UPDATE',
      userId: actorId,
      summary,
      metadata: {
        type: updated.type,
        description: updated.description,
        categoryId: updated.categoryId,
        categoryName: updated.category?.name ?? null,
        amount: Number(updated.amount),
        date: updated.date,
      },
    });

    return updated;
  }

  async getIncomeLineById(id: string) {
    const row = await this.prismaService.incomeLine.findFirst({
      where: { id, deletedAt: null },
      include: incomeLineInclude,
    });
    if (!row) throw new NotFoundException('Income line not found');
    return row;
  }

  async deleteIncomeLine(id: string, actorId?: string) {
    const current = await this.getIncomeLineById(id);
    const deleted = await this.prismaService.incomeLine.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: incomeLineInclude,
    });

    const typeLabel = incomeLineTypeLabel(deleted.type);
    const display = incomeLineDisplayLabel(current);
    const summary = `Ligne de revenu supprimée [${typeLabel}] : "${display}" · Montant : ${formatAuditMoney(deleted.amount)} · Date : ${formatAuditDate(deleted.date)}`;

    await this.auditService.log({
      entityType: 'INCOME_LINE',
      entityId: deleted.id,
      action: 'DELETE',
      userId: actorId,
      summary,
      metadata: {
        type: deleted.type,
        description: deleted.description,
        categoryId: deleted.categoryId,
        categoryName: current.category?.name ?? null,
        amount: Number(deleted.amount),
        date: deleted.date,
      },
    });

    return deleted;
  }

  async listIncomeLines(query: FetchIncomeLinesDto) {
    const { dateFilter, year, month } = this.resolvePeriod(query);
    const data = await this.prismaService.incomeLine.findMany({
      where: {
        deletedAt: null,
        date: dateFilter,
        ...(query.type ? { type: query.type } : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      },
      include: incomeLineInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return { year, month, data };
  }
}
