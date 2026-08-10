import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { buildAndFilters, composeWhere } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';
import { FetchAuditLogDto } from 'src/dto/audit/fetchAuditLog.dto';

export type AuditLogInput = {
  entityType: string;
  entityId: string;
  action: string;
  userId?: string | null;
  summary?: string | null;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditService {
  constructor(private readonly prismaService: PrismaService) {}

  async log(input: AuditLogInput) {
    try {
      await this.prismaService.auditLog.create({
        data: {
          entityType: input.entityType,
          entityId: input.entityId,
          action: input.action,
          userId: input.userId || null,
          summary: input.summary?.trim() || null,
          ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
        },
      });
    } catch {
      // Audit must not break primary mutations
    }
  }

  async list(
    query: FetchAuditLogDto,
    pagination: PaginationData,
    orderBy: Record<string, unknown>[],
  ) {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    const createdAtFilter: Prisma.DateTimeFilter | undefined =
      from || to
        ? {
            ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}),
            ...(to && !Number.isNaN(to.getTime()) ? { lte: to } : {}),
          }
        : undefined;

    const andWhere = buildAndFilters(
      query.entityType ? { entityType: query.entityType } : undefined,
      query.userId ? { userId: query.userId } : undefined,
      query.action ? { action: query.action } : undefined,
      createdAtFilter ? { createdAt: createdAtFilter } : undefined,
    );

    const proxied = ProxyPrismaModel(this.prismaService.auditLog as any);
    return proxied.findManyPaginated(
      {
        where: composeWhere({}, andWhere),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy,
      },
      pagination,
    );
  }
}
