import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProfessorDto } from 'src/dto/professor/createProfessor.dto';
import { UpdateProfessorDto } from 'src/dto/professor/updateProfessor.dto';
import { FetchProfessorsDto } from 'src/dto/professor/fetchProfessors.dto';
import { ProfessorRankingQueryDto } from 'src/dto/professor/professorRankingQuery.dto';
import { EReservationStatus, Prisma, Professor } from 'src/generated/prisma/client';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { buildAndFilters, composeWhere } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';
import { normalizeEmail } from 'src/common/utils/email.util';

@Injectable()
export class ProfessorService {
  constructor(private readonly prismaService: PrismaService) {}

  async createProfessor(dto: CreateProfessorDto): Promise<Professor> {
    const email = dto.email ? normalizeEmail(dto.email) : null;
    if (email) {
      const existing = await this.prismaService.professor.findFirst({
        where: { email, deletedAt: null },
      });
      if (existing) {
        throw new ConflictException('A professor with this email already exists');
      }
    }

    return this.prismaService.professor.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email,
        phone: dto.phone?.replaceAll(/\s+/g, '') || null,
        specialty: dto.specialty?.trim() || null,
        specialPrice:
          dto.specialPrice != null && !Number.isNaN(Number(dto.specialPrice))
            ? dto.specialPrice
            : null,
      },
    });
  }

  async updateProfessor(id: string, dto: UpdateProfessorDto): Promise<Professor> {
    await this.getProfessorById(id);
    if (dto.email) {
      const email = normalizeEmail(dto.email);
      const existing = await this.prismaService.professor.findFirst({
        where: { email, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('A professor with this email already exists');
      }
    }

    const data: Prisma.ProfessorUpdateInput = {
      ...(dto.firstName !== undefined && { firstName: dto.firstName.trim() }),
      ...(dto.lastName !== undefined && { lastName: dto.lastName.trim() }),
      ...(dto.email !== undefined && {
        email: dto.email ? normalizeEmail(dto.email) : null,
      }),
      ...(dto.phone !== undefined && {
        phone: dto.phone?.replaceAll(/\s+/g, '') || null,
      }),
      ...(dto.specialty !== undefined && {
        specialty: dto.specialty?.trim() || null,
      }),
      ...(dto.specialPrice !== undefined && {
        specialPrice:
          dto.specialPrice != null && !Number.isNaN(Number(dto.specialPrice))
            ? dto.specialPrice
            : null,
      }),
    };

    return this.prismaService.professor.update({ where: { id }, data });
  }

  async getProfessorById(id: string): Promise<Professor> {
    const professor = await this.prismaService.professor.findFirst({
      where: { id, deletedAt: null },
    });
    if (!professor) throw new NotFoundException('Professor not found');
    return professor;
  }

  async getProfessorDetail(id: string) {
    const professor = await this.getProfessorById(id);
    const baseWhere = {
      professorId: id,
      deletedAt: null,
      status: EReservationStatus.CONFIRMED,
    };

    const [unpaid, paid] = await Promise.all([
      this.prismaService.reservation.aggregate({
        where: { ...baseWhere, isPaid: false },
        _sum: { price: true },
        _count: true,
      }),
      this.prismaService.reservation.aggregate({
        where: { ...baseWhere, isPaid: true },
        _sum: { price: true },
        _count: true,
      }),
    ]);

    return {
      ...professor,
      unpaidTotal: Number(unpaid._sum.price ?? 0),
      unpaidCount: unpaid._count,
      paidTotal: Number(paid._sum.price ?? 0),
      paidCount: paid._count,
    };
  }

  async listProfessors(
    _query: FetchProfessorsDto,
    pagination: PaginationData,
    orderBy: Record<string, unknown>[],
    search?: Prisma.ProfessorWhereInput,
  ) {
    const andWhere = buildAndFilters(search);
    const proxied = ProxyPrismaModel(this.prismaService.professor as any);
    return proxied.findManyPaginated(
      {
        where: composeWhere({ deletedAt: null }, andWhere),
        orderBy,
      },
      pagination,
    );
  }

  async softDeleteProfessor(id: string): Promise<Professor> {
    await this.getProfessorById(id);
    return this.prismaService.professor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getDeletedProfessorById(id: string): Promise<Professor> {
    const professor = await this.prismaService.professor.findFirst({
      where: { id, deletedAt: { not: null } },
    });
    if (!professor) throw new NotFoundException('Deleted professor not found');
    return professor;
  }

  async listDeletedProfessors(
    pagination: PaginationData,
    orderBy: Record<string, unknown>[],
    search?: Prisma.ProfessorWhereInput,
  ) {
    const andWhere = buildAndFilters(search);
    const proxied = ProxyPrismaModel(this.prismaService.professor as any);
    return proxied.findManyPaginated(
      {
        where: composeWhere({ deletedAt: { not: null } }, andWhere),
        orderBy,
      },
      pagination,
    );
  }

  async restoreProfessor(id: string): Promise<Professor> {
    const professor = await this.getDeletedProfessorById(id);
    if (professor.email) {
      const conflict = await this.prismaService.professor.findFirst({
        where: {
          email: professor.email,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (conflict) {
        throw new ConflictException(
          'Another active professor already uses this email',
        );
      }
    }
    return this.prismaService.professor.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async hardDeleteProfessor(id: string): Promise<Professor> {
    await this.getDeletedProfessorById(id);
    return this.prismaService.professor.delete({ where: { id } });
  }

  async getRanking(query: ProfessorRankingQueryDto) {
    const startAt: Prisma.DateTimeFilter = {
      ...(query.from && { gte: new Date(query.from) }),
      ...(query.to && { lt: new Date(query.to) }),
    };
    const baseWhere: Prisma.ReservationWhereInput = {
      deletedAt: null,
      professorId: { not: null },
      professor: { deletedAt: null },
      ...((query.from || query.to) && { startAt }),
    };

    const [reservations, cancelledGroups, professors] = await Promise.all([
      this.prismaService.reservation.findMany({
        where: { ...baseWhere, status: EReservationStatus.CONFIRMED },
        select: {
          professorId: true,
          startAt: true,
          endAt: true,
          price: true,
          isPaid: true,
          paidAt: true,
        },
      }),
      this.prismaService.reservation.groupBy({
        by: ['professorId'],
        where: { ...baseWhere, status: EReservationStatus.CANCELLED },
        _count: { _all: true },
      }),
      this.prismaService.professor.findMany({
        where: { deletedAt: null },
        select: { id: true, firstName: true, lastName: true, specialty: true },
      }),
    ]);

    const msPerHour = 60 * 60 * 1000;
    const msPerDay = 24 * msPerHour;
    const stats = new Map<
      string,
      { revenue: number; paid: number; hours: number; sessions: number; delaySum: number; delayCount: number }
    >();

    for (const reservation of reservations) {
      const professorId = reservation.professorId as string;
      const entry = stats.get(professorId) ?? {
        revenue: 0,
        paid: 0,
        hours: 0,
        sessions: 0,
        delaySum: 0,
        delayCount: 0,
      };
      const price = Number(reservation.price);
      entry.revenue += price;
      entry.sessions += 1;
      entry.hours += (reservation.endAt.getTime() - reservation.startAt.getTime()) / msPerHour;
      if (reservation.isPaid) {
        entry.paid += price;
        if (reservation.paidAt) {
          entry.delaySum += Math.max(0, reservation.paidAt.getTime() - reservation.startAt.getTime()) / msPerDay;
          entry.delayCount += 1;
        }
      }
      stats.set(professorId, entry);
    }

    const cancelledByProfessor = new Map(
      cancelledGroups.map((group) => [group.professorId as string, group._count._all]),
    );
    const round2 = (value: number) => Math.round(value * 100) / 100;

    const rows = professors
      .map((professor) => {
        const entry = stats.get(professor.id);
        const revenue = entry?.revenue ?? 0;
        const paid = entry?.paid ?? 0;
        return {
          professorId: professor.id,
          firstName: professor.firstName,
          lastName: professor.lastName,
          specialty: professor.specialty,
          revenue: round2(revenue),
          paid: round2(paid),
          unpaid: round2(revenue - paid),
          hours: round2(entry?.hours ?? 0),
          sessions: entry?.sessions ?? 0,
          cancelled: cancelledByProfessor.get(professor.id) ?? 0,
          avgPaymentDelayDays:
            entry && entry.delayCount > 0 ? round2(entry.delaySum / entry.delayCount) : null,
        };
      })
      .filter((row) => row.sessions > 0 || row.cancelled > 0)
      .sort((a, b) => b.revenue - a.revenue);

    const totals = rows.reduce(
      (acc, row) => ({
        revenue: round2(acc.revenue + row.revenue),
        paid: round2(acc.paid + row.paid),
        unpaid: round2(acc.unpaid + row.unpaid),
        hours: round2(acc.hours + row.hours),
        sessions: acc.sessions + row.sessions,
        cancelled: acc.cancelled + row.cancelled,
      }),
      { revenue: 0, paid: 0, unpaid: 0, hours: 0, sessions: 0, cancelled: 0 },
    );

    return { rows, totals };
  }

  async countActive(): Promise<number> {
    return this.prismaService.professor.count({
      where: { deletedAt: null },
    });
  }
}
