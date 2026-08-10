import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDailyIncomeDto } from 'src/dto/dailyIncome/createDailyIncome.dto';
import { UpdateDailyIncomeDto } from 'src/dto/dailyIncome/updateDailyIncome.dto';
import { FetchDailyIncomeDto } from 'src/dto/dailyIncome/fetchDailyIncome.dto';
import {
  CreateIncomeLineDto,
  UpdateIncomeLineDto,
} from 'src/dto/dailyIncome/createIncomeLine.dto';
import { FetchIncomeLinesDto } from 'src/dto/dailyIncome/fetchIncomeLines.dto';
import { EIncomeLineType } from 'src/generated/prisma/client';
import { AuditService } from '../audit/audit.service';

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

  private calcTwentyPercent(totalIncome: number): string {
    return Math.round(totalIncome * 0.2).toFixed(2);
  }

  private monthRange(year: number, month: number): { from: Date; to: Date } {
    const from = new Date(Date.UTC(year, month - 1, 1));
    const to = new Date(Date.UTC(year, month, 1));
    return { from, to };
  }

  private resolvePeriod(query: { year?: number; month?: number }) {
    const now = new Date();
    const year = query.year ?? now.getUTCFullYear();
    const month = query.month ?? now.getUTCMonth() + 1;
    return { year, month, ...this.monthRange(year, month) };
  }

  async createDailyIncome(dto: CreateDailyIncomeDto, actorId?: string) {
    const date = this.toDateOnly(dto.date);
    const existing = await this.prismaService.dailyIncome.findFirst({
      where: { date, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('A daily income entry already exists for this date');
    }

    const totalIncome = Number(dto.totalIncome);
    const created = await this.prismaService.dailyIncome.create({
      data: {
        date,
        totalIncome: totalIncome.toFixed(2),
        savings: this.calcTwentyPercent(totalIncome),
        benefits: this.calcTwentyPercent(totalIncome),
        notes: dto.notes?.trim() || null,
      },
    });

    await this.auditService.log({
      entityType: 'DAILY_INCOME',
      entityId: created.id,
      action: 'CREATE',
      userId: actorId,
      summary: `Created daily income for ${this.dateKey(created.date)}`,
    });

    return created;
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
      const conflict = await this.prismaService.dailyIncome.findFirst({
        where: { date, deletedAt: null, id: { not: id } },
      });
      if (conflict) {
        throw new ConflictException('A daily income entry already exists for this date');
      }
    }

    const totalIncome =
      dto.totalIncome !== undefined ? Number(dto.totalIncome) : Number(existing.totalIncome);

    const updated = await this.prismaService.dailyIncome.update({
      where: { id },
      data: {
        date,
        totalIncome: totalIncome.toFixed(2),
        savings: this.calcTwentyPercent(totalIncome),
        benefits: this.calcTwentyPercent(totalIncome),
        ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null }),
      },
    });

    await this.auditService.log({
      entityType: 'DAILY_INCOME',
      entityId: updated.id,
      action: 'UPDATE',
      userId: actorId,
      summary: `Updated daily income for ${this.dateKey(updated.date)}`,
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

    await this.auditService.log({
      entityType: 'DAILY_INCOME',
      entityId: deleted.id,
      action: 'DELETE',
      userId: actorId,
      summary: `Deleted daily income for ${this.dateKey(deleted.date)}`,
    });

    return deleted;
  }

  async listDailyIncomes(query: FetchDailyIncomeDto) {
    const { from, to, year, month } = this.resolvePeriod(query);

    const days = await this.prismaService.dailyIncome.findMany({
      where: { deletedAt: null, date: { gte: from, lt: to } },
      orderBy: { date: 'asc' },
    });

    const lines = await this.prismaService.incomeLine.findMany({
      where: { deletedAt: null, date: { gte: from, lt: to } },
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

    const data = days.map((day) => {
      const bucket = linesByDay.get(this.dateKey(day.date)) ?? {
        charges: 0,
        investments: 0,
      };
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
    const { from, to, year, month } = this.resolvePeriod(query);

    const [incomeAgg, chargeAgg, investmentAgg] = await Promise.all([
      this.prismaService.dailyIncome.aggregate({
        where: { deletedAt: null, date: { gte: from, lt: to } },
        _sum: { totalIncome: true, savings: true, benefits: true },
      }),
      this.prismaService.incomeLine.aggregate({
        where: {
          deletedAt: null,
          date: { gte: from, lt: to },
          type: EIncomeLineType.CHARGE,
        },
        _sum: { amount: true },
      }),
      this.prismaService.incomeLine.aggregate({
        where: {
          deletedAt: null,
          date: { gte: from, lt: to },
          type: EIncomeLineType.INVESTMENT,
        },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(incomeAgg._sum.totalIncome ?? 0);
    const totalSavings = Number(incomeAgg._sum.savings ?? 0);
    const totalBenefits = Number(incomeAgg._sum.benefits ?? 0);
    const totalCharges = Number(chargeAgg._sum.amount ?? 0);
    const totalInvestments = Number(investmentAgg._sum.amount ?? 0);
    const netBalance =
      Math.round((totalIncome - totalCharges - totalInvestments) * 100) / 100;

    return {
      year,
      month,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalCharges: Math.round(totalCharges * 100) / 100,
      totalInvestments: Math.round(totalInvestments * 100) / 100,
      totalSavings: Math.round(totalSavings * 100) / 100,
      totalBenefits: Math.round(totalBenefits * 100) / 100,
      netBalance,
    };
  }

  async getTrend(months: number) {
    const now = new Date();
    const count = Math.min(Math.max(Math.trunc(months) || 6, 1), 24);
    const periods = Array.from({ length: count }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
    return Promise.all(periods.map((period) => this.getSummary(period)));
  }

  async createIncomeLine(dto: CreateIncomeLineDto, actorId?: string) {
    const date = this.toDateOnly(dto.date);
    const created = await this.prismaService.incomeLine.create({
      data: {
        date,
        type: dto.type,
        label: dto.label.trim(),
        amount: Number(dto.amount).toFixed(2),
      },
    });

    await this.auditService.log({
      entityType: 'INCOME_LINE',
      entityId: created.id,
      action: 'CREATE',
      userId: actorId,
      summary: `Created ${created.type.toLowerCase()} line: ${created.label}`,
    });

    return created;
  }

  async updateIncomeLine(
    id: string,
    dto: UpdateIncomeLineDto,
    actorId?: string,
  ) {
    await this.getIncomeLineById(id);
    const updated = await this.prismaService.incomeLine.update({
      where: { id },
      data: {
        ...(dto.date !== undefined && { date: this.toDateOnly(dto.date) }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.label !== undefined && { label: dto.label.trim() }),
        ...(dto.amount !== undefined && { amount: Number(dto.amount).toFixed(2) }),
      },
    });

    await this.auditService.log({
      entityType: 'INCOME_LINE',
      entityId: updated.id,
      action: 'UPDATE',
      userId: actorId,
      summary: `Updated income line: ${updated.label}`,
    });

    return updated;
  }

  async getIncomeLineById(id: string) {
    const row = await this.prismaService.incomeLine.findFirst({
      where: { id, deletedAt: null },
    });
    if (!row) throw new NotFoundException('Income line not found');
    return row;
  }

  async deleteIncomeLine(id: string, actorId?: string) {
    await this.getIncomeLineById(id);
    const deleted = await this.prismaService.incomeLine.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      entityType: 'INCOME_LINE',
      entityId: deleted.id,
      action: 'DELETE',
      userId: actorId,
      summary: `Deleted income line: ${deleted.label}`,
    });

    return deleted;
  }

  async listIncomeLines(query: FetchIncomeLinesDto) {
    const { from, to, year, month } = this.resolvePeriod(query);
    const data = await this.prismaService.incomeLine.findMany({
      where: {
        deletedAt: null,
        date: { gte: from, lt: to },
        ...(query.type ? { type: query.type } : {}),
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
    return { year, month, data };
  }
}
