import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ENotificationType, ERole, EStatus, Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';

interface NotifyInput {
  type: ENotificationType;
  title: string;
  body?: string;
  data?: Prisma.InputJsonValue;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly gateway: NotificationGateway,
  ) {}

  /** Stores a notification for every active staff member (ADMIN / USER) and pushes it in real time. */
  async notifyStaff(input: NotifyInput) {
    try {
      const staff = await this.prismaService.user.findMany({
        where: {
          role: { in: [ERole.ADMIN, ERole.USER] },
          status: EStatus.ACTIVE,
          deletedAt: null,
          archivedAt: null,
        },
        select: { id: true },
      });
      if (staff.length === 0) return;

      const created = await this.prismaService.notification.createManyAndReturn({
        data: staff.map((user) => ({
          userId: user.id,
          type: input.type,
          title: input.title,
          body: input.body ?? null,
          data: input.data ?? Prisma.JsonNull,
        })),
      });

      for (const notification of created) {
        this.gateway.emitToUser(notification.userId, notification);
      }
    } catch (error) {
      // A failed notification must never roll back the action that triggered it.
      this.logger.error('Failed to notify staff', error instanceof Error ? error.stack : String(error));
    }
  }

  async list(userId: string, page: number, perPage: number, unreadOnly: boolean) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(unreadOnly && { readAt: null }),
    };
    const [items, total, unread] = await Promise.all([
      this.prismaService.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prismaService.notification.count({ where }),
      this.prismaService.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { data: items, meta: { total, page, perPage, unread } };
  }

  async unreadCount(userId: string) {
    const count = await this.prismaService.notification.count({ where: { userId, readAt: null } });
    return { count };
  }

  async markRead(userId: string, id: string) {
    const result = await this.prismaService.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (result.count === 0) {
      const exists = await this.prismaService.notification.findFirst({ where: { id, userId } });
      if (!exists) throw new NotFoundException('Notification not found');
    }
    return { id };
  }

  async markAllRead(userId: string) {
    const result = await this.prismaService.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { count: result.count };
  }
}
