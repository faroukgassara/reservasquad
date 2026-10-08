import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { PaginationData } from 'src/common/pagination/types';
import {
  FetchSubscriptionsDto,
  RenewSubscriptionDto,
  SaveSubscriptionDto,
  SubscriptionState,
} from 'src/dto/pos/posSubscription.dto';
import { AuditService } from '../audit/audit.service';
import {
  addDays,
  formatSubscriptionNumber,
  periodEnd,
  POS_AUDIT,
  round3,
  todayDateOnly,
  toDateOnly,
} from './pos.utils';

const EXPIRING_DAYS = 7;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SubscriptionCardState = 'DRAFT' | 'CANCELLED' | 'UPCOMING' | 'VALID' | 'EXPIRED';

const userSelect = { id: true, firstName: true, lastName: true } satisfies Prisma.UserSelect;
const clientSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  email: true,
  address: true,
  taxId: true,
  cin: true,
} satisfies Prisma.CreditClientSelect;

const listInclude = {
  client: { select: clientSelect },
} satisfies Prisma.SubscriptionInclude;

const detailInclude = {
  ...listInclude,
  createdBy: { select: userSelect },
  renewedFrom: { select: { id: true, number: true } },
  renewal: { select: { id: true, number: true } },
  invoices: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, type: true, status: true, year: true, sequence: true, total: true, amountPaid: true },
  },
} satisfies Prisma.SubscriptionInclude;

function stateWhere(state: SubscriptionState): Prisma.SubscriptionWhereInput {
  const today = todayDateOnly();
  if (state === 'expired') return { status: 'ACTIVE', endDate: { lt: today } };
  if (state === 'expiring') {
    return { status: 'ACTIVE', endDate: { gte: today, lte: addDays(today, EXPIRING_DAYS) } };
  }
  return { status: 'ACTIVE', endDate: { gte: today } };
}

@Injectable()
export class PosSubscriptionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private async log(entityId: string, action: 'CREATE' | 'UPDATE' | 'DELETE', summary: string, actorId?: string) {
    await this.auditService.log({ entityType: POS_AUDIT.subscription, entityId, action, userId: actorId, summary });
  }

  private async findOrThrow(id: string) {
    const subscription = await this.prismaService.subscription.findFirst({
      where: { id, deletedAt: null },
      include: detailInclude,
    });
    if (!subscription) throw new NotFoundException('Subscription not found');
    return subscription;
  }

  /** Validates client and product, then computes the period and amounts. */
  private async buildData(dto: SaveSubscriptionDto) {
    const client = await this.prismaService.creditClient.findFirst({
      where: { id: dto.clientId, deletedAt: null },
      select: { id: true },
    });
    if (!client) throw new BadRequestException('Client not found');
    const product = await this.prismaService.posProduct.findFirst({
      where: { id: dto.productId, deletedAt: null },
    });
    if (!product) throw new BadRequestException('Product not found');
    if (!product.subscriptionDuration || !product.subscriptionUnit) {
      throw new BadRequestException('This product has no subscription duration');
    }
    const startDate = toDateOnly(dto.startDate);
    const unitPrice = dto.unitPrice ?? Number(product.price);
    const discountType = dto.discountType ?? 'PERCENT';
    const discountPct = discountType === 'PERCENT' ? (dto.discountPct ?? 0) : 0;
    const discountAmount = discountType === 'AMOUNT' ? (dto.discountAmount ?? 0) : 0;
    if (discountAmount > unitPrice) throw new BadRequestException('The discount exceeds the price');
    const subtotal =
      discountType === 'AMOUNT' ? round3(unitPrice - discountAmount) : round3(unitPrice * (1 - discountPct / 100));
    return {
      clientId: client.id,
      productId: product.id,
      productName: product.name,
      duration: product.subscriptionDuration,
      unit: product.subscriptionUnit,
      startDate,
      endDate: periodEnd(startDate, product.subscriptionDuration, product.subscriptionUnit),
      unitPrice,
      discountType,
      discountPct,
      discountAmount,
      taxRate: 0,
      subtotal,
      taxAmount: 0,
      total: subtotal,
      note: dto.note?.trim() || null,
    };
  }

  async list(query: FetchSubscriptionsDto, pagination: PaginationData) {
    const search = query.search?.trim();
    const digits = search?.replace(/^abn/i, '');
    const searchNumber = digits && /^\d+$/.test(digits) ? Number(digits) : undefined;
    const where: Prisma.SubscriptionWhereInput = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.state && stateWhere(query.state)),
      ...(query.clientId && { clientId: query.clientId }),
      ...(query.payable && {
        status: { in: ['DRAFT', 'ACTIVE'] },
        amountPaid: { lt: this.prismaService.subscription.fields.total },
      }),
      ...(search && {
        OR: [
          ...(searchNumber !== undefined && searchNumber <= 2147483647 ? [{ number: searchNumber }] : []),
          { productName: { contains: search, mode: 'insensitive' } },
          { client: { firstName: { contains: search, mode: 'insensitive' } } },
          { client: { lastName: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };
    const orderBy: Prisma.SubscriptionOrderByWithRelationInput[] =
      query.state === 'expiring' ? [{ endDate: 'asc' }] : [{ number: 'desc' }];
    const proxied = ProxyPrismaModel(this.prismaService.subscription as any);
    return proxied.findManyPaginated({ where, orderBy, include: listInclude }, pagination);
  }

  async getById(id: string) {
    return this.findOrThrow(id);
  }

  /** Public member card: only what the reception needs to check, no contact or billing data. */
  async getCard(token: string) {
    const subscription = UUID_PATTERN.test(token)
      ? await this.prismaService.subscription.findFirst({
          where: { cardToken: token, deletedAt: null },
          select: {
            number: true,
            status: true,
            productName: true,
            duration: true,
            unit: true,
            startDate: true,
            endDate: true,
            client: { select: { firstName: true, lastName: true } },
          },
        })
      : null;
    if (!subscription) throw new NotFoundException('Card not found');
    const today = todayDateOnly();
    let state: SubscriptionCardState = 'VALID';
    if (subscription.status !== 'ACTIVE') state = subscription.status;
    else if (subscription.startDate > today) state = 'UPCOMING';
    else if (subscription.endDate < today) state = 'EXPIRED';
    return { ...subscription, state };
  }

  async create(dto: SaveSubscriptionDto, actorId?: string) {
    const data = await this.buildData(dto);
    const subscription = await this.prismaService.subscription.create({
      data: { ...data, createdById: actorId || null },
    });
    await this.log(
      subscription.id,
      'CREATE',
      `Created subscription ${formatSubscriptionNumber(subscription.number)}`,
      actorId,
    );
    return this.findOrThrow(subscription.id);
  }

  async update(id: string, dto: SaveSubscriptionDto, actorId?: string) {
    const existing = await this.findOrThrow(id);
    if (existing.status !== 'DRAFT') throw new BadRequestException('Only draft subscriptions can be edited');
    const data = await this.buildData(dto);
    await this.prismaService.subscription.update({ where: { id }, data });
    await this.log(id, 'UPDATE', `Updated subscription ${formatSubscriptionNumber(existing.number)}`, actorId);
    return this.findOrThrow(id);
  }

  async activate(id: string, actorId?: string) {
    const subscription = await this.findOrThrow(id);
    if (subscription.status !== 'DRAFT') throw new BadRequestException('Only draft subscriptions can be activated');
    await this.prismaService.subscription.update({
      where: { id },
      data: { status: 'ACTIVE', activatedAt: new Date() },
    });
    await this.log(id, 'UPDATE', `Activated subscription ${formatSubscriptionNumber(subscription.number)}`, actorId);
    return this.findOrThrow(id);
  }

  async cancel(id: string, actorId?: string) {
    const subscription = await this.findOrThrow(id);
    if (subscription.status === 'CANCELLED') throw new BadRequestException('Subscription is already cancelled');
    if (subscription.invoices.some((inv) => inv.type === 'INVOICE' && inv.status === 'POSTED')) {
      throw new BadRequestException('This subscription has a posted invoice');
    }
    if (Number(subscription.amountPaid) > 0) {
      throw new BadRequestException('This subscription has payments from the register');
    }
    await this.prismaService.$transaction([
      this.prismaService.invoice.updateMany({
        where: { subscriptionId: id, status: 'DRAFT' },
        data: { status: 'CANCELLED' },
      }),
      this.prismaService.subscription.update({ where: { id }, data: { status: 'CANCELLED' } }),
    ]);
    await this.log(id, 'UPDATE', `Cancelled subscription ${formatSubscriptionNumber(subscription.number)}`, actorId);
    return this.findOrThrow(id);
  }

  /** Creates the next period as a draft for the same client and product, from the chosen start date. */
  async renew(id: string, dto: RenewSubscriptionDto, actorId?: string) {
    const subscription = await this.findOrThrow(id);
    if (subscription.status !== 'ACTIVE') throw new BadRequestException('Only active subscriptions can be renewed');
    if (subscription.renewal) throw new BadRequestException('This subscription is already renewed');
    if (!subscription.productId) throw new BadRequestException('The subscription product no longer exists');
    const data = await this.buildData({
      clientId: subscription.clientId,
      productId: subscription.productId,
      startDate: dto.startDate,
      unitPrice: Number(subscription.unitPrice),
      discountType: subscription.discountType,
      discountPct: Number(subscription.discountPct),
      discountAmount: Number(subscription.discountAmount),
      note: subscription.note,
    });
    const renewal = await this.prismaService.subscription.create({
      data: { ...data, renewedFromId: id, createdById: actorId || null },
    });
    await this.log(
      renewal.id,
      'CREATE',
      `Renewed ${formatSubscriptionNumber(subscription.number)} as ${formatSubscriptionNumber(renewal.number)}`,
      actorId,
    );
    return this.findOrThrow(renewal.id);
  }

  async remove(id: string, actorId?: string) {
    const subscription = await this.findOrThrow(id);
    if (subscription.status !== 'DRAFT' && subscription.status !== 'CANCELLED') {
      throw new BadRequestException('Only draft or cancelled subscriptions can be deleted');
    }
    await this.prismaService.subscription.update({
      where: { id },
      data: { deletedAt: new Date(), renewedFromId: null },
    });
    await this.log(id, 'DELETE', `Deleted subscription ${formatSubscriptionNumber(subscription.number)}`, actorId);
    return { id };
  }
}
