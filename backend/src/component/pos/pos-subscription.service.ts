import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEnv } from 'src/common/env/env';
import { FileUploadService } from 'src/common/common-services/file-upload.service';
import { EmailService } from 'src/common/email/email.service';
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
import { formatAuditDate, formatAuditMoney } from 'src/common/utils/audit-format.util';

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
  private readonly logger = new Logger(PosSubscriptionService.name);
  private readonly config?: IEnv;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly fileUploadService: FileUploadService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.config = this.configService.get<IEnv>('env');
  }

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
    const digits = search?.replace(/^(abn|s)/i, '');
    const searchNumber = digits && /^\d+$/.test(digits) ? Number(digits) : undefined;
    const where: Prisma.SubscriptionWhereInput = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.state && stateWhere(query.state)),
      ...(query.clientId && { clientId: query.clientId }),
      ...(query.payable && {
        status: 'ACTIVE',
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

  async summary() {
    const [all, running, expiring, expired] = await Promise.all([
      this.prismaService.subscription.count({ where: { deletedAt: null } }),
      this.prismaService.subscription.count({ where: { deletedAt: null, ...stateWhere('running') } }),
      this.prismaService.subscription.count({ where: { deletedAt: null, ...stateWhere('expiring') } }),
      this.prismaService.subscription.count({ where: { deletedAt: null, ...stateWhere('expired') } }),
    ]);
    return { all, running, expiring, expired };
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
      data: {
        ...data,
        status: 'ACTIVE',
        activatedAt: new Date(),
        createdById: actorId || null,
      },
    });
    await this.log(
      subscription.id,
      'CREATE',
      `Abonnement N° ${formatSubscriptionNumber(subscription.number)} créé : Produit "${subscription.productName}" · Du ${formatAuditDate(subscription.startDate)} au ${formatAuditDate(subscription.endDate)} · Montant : ${formatAuditMoney(subscription.total)}`,
      actorId,
    );
    await this.sendSubscriptionEmail(subscription, false);
    return this.findOrThrow(subscription.id);
  }

  async update(id: string, dto: SaveSubscriptionDto, actorId?: string) {
    const existing = await this.findOrThrow(id);
    if (existing.status === 'CANCELLED') throw new BadRequestException('Cancelled subscriptions cannot be edited');
    if (existing.invoices.some((inv) => inv.type === 'INVOICE' && inv.status === 'POSTED')) {
      throw new BadRequestException('This subscription has a posted invoice');
    }
    if (Number(existing.amountPaid) > 0) {
      throw new BadRequestException('This subscription has payments from the register');
    }
    const data = await this.buildData(dto);
    await this.prismaService.subscription.update({ where: { id }, data });
    await this.log(id, 'UPDATE', `Updated subscription ${formatSubscriptionNumber(existing.number)}`, actorId);
    return this.findOrThrow(id);
  }

  async activate(id: string, actorId?: string) {
    const subscription = await this.findOrThrow(id);
    if (subscription.status !== 'ACTIVE') {
      await this.prismaService.subscription.update({
        where: { id },
        data: { status: 'ACTIVE', activatedAt: new Date() },
      });
      await this.log(id, 'UPDATE', `Activated subscription ${formatSubscriptionNumber(subscription.number)}`, actorId);
    }
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
    await this.log(
      id,
      'UPDATE',
      `Abonnement N° ${formatSubscriptionNumber(subscription.number)} annulé : Produit "${subscription.productName}"`,
      actorId,
    );
    return this.findOrThrow(id);
  }

  /** Creates the next period as an active subscription for the same client and product, from the chosen start date. */
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
      data: {
        ...data,
        status: 'ACTIVE',
        activatedAt: new Date(),
        renewedFromId: id,
        createdById: actorId || null,
      },
    });
    await this.log(
      renewal.id,
      'CREATE',
      `Abonnement N° ${formatSubscriptionNumber(subscription.number)} renouvelé sous le N° ${formatSubscriptionNumber(renewal.number)} : Produit "${renewal.productName}" · Du ${formatAuditDate(renewal.startDate)} au ${formatAuditDate(renewal.endDate)}`,
      actorId,
    );
    await this.sendSubscriptionEmail(renewal, true);
    return this.findOrThrow(renewal.id);
  }

  async remove(id: string, actorId?: string) {
    const subscription = await this.findOrThrow(id);
    if (subscription.invoices.some((inv) => inv.type === 'INVOICE' && inv.status === 'POSTED')) {
      throw new BadRequestException('This subscription has a posted invoice');
    }
    if (Number(subscription.amountPaid) > 0) {
      throw new BadRequestException('This subscription has payments from the register');
    }
    await this.prismaService.subscription.update({
      where: { id },
      data: { deletedAt: new Date(), renewedFromId: null },
    });
    await this.log(id, 'DELETE', `Deleted subscription ${formatSubscriptionNumber(subscription.number)}`, actorId);
    return { id };
  }

  /**
   * Manually sends an expiration reminder email to the client for an active/expiring subscription.
   * Throws BadRequestException if client has no valid email.
   */
  async sendManualReminder(id: string, actorId?: string) {
    const subscription = await this.findOrThrow(id);
    const client = subscription.client;
    if (!client) {
      throw new BadRequestException('Client introuvable pour cet abonnement.');
    }

    if (subscription.remindedAt) {
      throw new BadRequestException(
        `Un e-mail de rappel a déjà été envoyé pour cet abonnement le ${formatAuditDate(subscription.remindedAt)}.`,
      );
    }

    const email = client.email?.trim();
    const clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client';

    if (!email || !email.includes('@')) {
      throw new BadRequestException(
        `Le client "${clientName}" n'a pas d'adresse e-mail valide renseignée.`,
      );
    }

    const frontUrl = (this.config?.FRONT_URL || process.env.FRONT_URL || 'http://localhost:3000').replace(/\/$/, '');
    const cardUrl = subscription.cardToken
      ? `${frontUrl}/api/public/subscription-cards/${subscription.cardToken}`
      : `${frontUrl}/caisse/subscriptions/${subscription.id}`;

    const today = todayDateOnly();
    const end = toDateOnly(subscription.endDate);
    const diffDays = Math.round((end.getTime() - today.getTime()) / 86_400_000);
    const daysLeftText =
      diffDays <= 0
        ? "Expire aujourd'hui"
        : diffDays === 1
          ? "Expire demain (dans 1 jour)"
          : `Expire dans ${diffDays} jours`;

    const html = await this.fileUploadService.renderTemplate(
      {
        clientName,
        subscriptionNumber: formatSubscriptionNumber(subscription.number),
        productName: subscription.productName,
        startDate: formatAuditDate(subscription.startDate),
        endDate: formatAuditDate(subscription.endDate),
        daysLeftText,
        cardUrl,
        frontUrl,
      },
      'subscriptionReminderClient.ejs',
    );

    const fromAddress = this.config?.SMTP_SEND || process.env.SMTP_SEND || 'coworking-space@bibliosquad.com';

    await this.emailService.sendMail({
      to: email,
      from: fromAddress,
      subject: `Rappel d'échéance : votre abonnement Biblio Squad expire bientôt (${formatSubscriptionNumber(subscription.number)})`,
      template: html,
      attachments: [this.emailService.getBiblioSquadLogoAttachment()],
    });

    const now = new Date();
    await this.prismaService.subscription.update({
      where: { id },
      data: { remindedAt: now },
    });

    await this.log(
      id,
      'UPDATE',
      `Rappel d'échéance envoyé à ${clientName} (${email}) pour l'abonnement N° ${formatSubscriptionNumber(subscription.number)}`,
      actorId,
    );

    return {
      success: true,
      email,
      clientName,
      subscriptionNumber: formatSubscriptionNumber(subscription.number),
      remindedAt: now,
    };
  }

  /**
   * Automatic background job: checks daily for active subscriptions expiring tomorrow (J-1).
   * Only sends the reminder email if a reminder has NOT already been sent manually or previously (remindedAt is null).
   * Includes database query with range filter, defensive condition checks (client & valid email),
   * email rendering & dispatch, database status update (remindedAt = now), and audit logging.
   */
  async processAutomaticExpirationReminders() {
    const today = todayDateOnly();
    const tomorrow = addDays(today, 1);
    const tomorrowEnd = new Date(
      Date.UTC(
        tomorrow.getUTCFullYear(),
        tomorrow.getUTCMonth(),
        tomorrow.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const targetDateStr = tomorrow.toISOString().split('T')[0];
    this.logger.log(
      `[CRON SUBSCRIPTION REMINDER] Checking active subscriptions expiring tomorrow (${targetDateStr} - J-1)...`,
    );

    // 1. Database query: ACTIVE, non-deleted subscriptions expiring tomorrow with remindedAt == null
    const expiringSubscriptions = await this.prismaService.subscription.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        remindedAt: null,
        endDate: {
          gte: tomorrow,
          lte: tomorrowEnd,
        },
      },
      include: {
        client: { select: clientSelect },
      },
      orderBy: {
        number: 'asc',
      },
    });

    const totalFound = expiringSubscriptions.length;
    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    const details: Array<{
      id: string;
      subscriptionNumber: string;
      clientName: string;
      email?: string;
      status: 'SENT' | 'SKIPPED' | 'FAILED';
      reason?: string;
    }> = [];

    const frontUrl = (this.config?.FRONT_URL || process.env.FRONT_URL || 'http://localhost:3000').replace(/\/$/, '');
    const fromAddress = this.config?.SMTP_SEND || process.env.SMTP_SEND || 'coworking-space@bibliosquad.com';

    for (const subscription of expiringSubscriptions) {
      const subNumber = formatSubscriptionNumber(subscription.number);
      const client = subscription.client;

      // Condition Check 1: Client must exist
      if (!client) {
        this.logger.warn(`[CRON] Subscription ${subNumber} skipped: missing client association.`);
        skippedCount++;
        details.push({
          id: subscription.id,
          subscriptionNumber: subNumber,
          clientName: 'Inconnu',
          status: 'SKIPPED',
          reason: 'Client association not found',
        });
        continue;
      }

      const clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client';
      const email = client.email?.trim();

      // Condition Check 2: Valid email check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        this.logger.warn(
          `[CRON] Subscription ${subNumber} for "${clientName}" skipped: invalid or missing email address (${email || 'none'}).`,
        );
        skippedCount++;
        details.push({
          id: subscription.id,
          subscriptionNumber: subNumber,
          clientName,
          email,
          status: 'SKIPPED',
          reason: 'Missing or invalid email',
        });
        continue;
      }

      // Condition Check 3: Ensure not already reminded (defensive double-check)
      if (subscription.remindedAt) {
        skippedCount++;
        details.push({
          id: subscription.id,
          subscriptionNumber: subNumber,
          clientName,
          email,
          status: 'SKIPPED',
          reason: 'Reminder already sent',
        });
        continue;
      }

      try {
        const cardUrl = subscription.cardToken
          ? `${frontUrl}/api/public/subscription-cards/${subscription.cardToken}`
          : `${frontUrl}/caisse/subscriptions/${subscription.id}`;

        const html = await this.fileUploadService.renderTemplate(
          {
            clientName,
            subscriptionNumber: subNumber,
            productName: subscription.productName,
            startDate: formatAuditDate(subscription.startDate),
            endDate: formatAuditDate(subscription.endDate),
            daysLeftText: 'Expire demain (dans 1 jour)',
            cardUrl,
            frontUrl,
          },
          'subscriptionReminderClient.ejs',
        );

        await this.emailService.sendMail({
          to: email,
          from: fromAddress,
          subject: `Rappel d'échéance : votre abonnement Biblio Squad expire demain (${subNumber})`,
          template: html,
          attachments: [this.emailService.getBiblioSquadLogoAttachment()],
        });

        // Update database: set remindedAt timestamp
        const now = new Date();
        await this.prismaService.subscription.update({
          where: { id: subscription.id },
          data: { remindedAt: now },
        });

        // Audit trail logging
        await this.log(
          subscription.id,
          'UPDATE',
          `[AUTOMATIQUE] Rappel J-1 envoyé avec succès à ${clientName} (${email}) pour l'abonnement N° ${subNumber}`,
        );

        sentCount++;
        details.push({
          id: subscription.id,
          subscriptionNumber: subNumber,
          clientName,
          email,
          status: 'SENT',
        });

        this.logger.log(`[CRON] Reminder sent to ${clientName} (${email}) for subscription ${subNumber}.`);
      } catch (err: unknown) {
        failedCount++;
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `[CRON] Failed to send reminder email for subscription ${subNumber} (${email}): ${errMsg}`,
        );
        details.push({
          id: subscription.id,
          subscriptionNumber: subNumber,
          clientName,
          email,
          status: 'FAILED',
          reason: errMsg,
        });
      }
    }

    this.logger.log(
      `[CRON SUBSCRIPTION REMINDER] Completed: ${totalFound} eligible subscription(s), ${sentCount} sent, ${skippedCount} skipped, ${failedCount} failed.`,
    );

    return {
      executionDate: new Date(),
      targetDate: tomorrow,
      totalFound,
      sentCount,
      skippedCount,
      failedCount,
      details,
    };
  }

  /**
   * Sends confirmation / renewal email to client if valid email is present.
   * If client has no email, logs warning and proceeds without error.
   * Never throws or blocks subscription lifecycle.
   */
  private async sendSubscriptionEmail(
    subscription: {
      id: string;
      number: number;
      cardToken?: string | null;
      productName: string;
      duration: number;
      unit: string;
      startDate: Date;
      endDate: Date;
      total: any;
      clientId: string;
    },
    isRenewal = false,
  ): Promise<void> {
    try {
      const client = await this.prismaService.creditClient.findFirst({
        where: { id: subscription.clientId, deletedAt: null },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!client) {
        this.logger.warn(
          `Impossible d'envoyer l'e-mail d'abonnement : client ID "${subscription.clientId}" introuvable.`,
        );
        return;
      }

      const email = client.email?.trim();
      const clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client';

      if (!email || !email.includes('@')) {
        this.logger.warn(
          `Abonnement N° ${formatSubscriptionNumber(subscription.number)} (${isRenewal ? 'renouvellement' : 'création'}) : le client "${clientName}" n'a pas d'adresse e-mail valide renseignée. Envoi de l'e-mail ignoré.`,
        );
        return;
      }

      const frontUrl = (this.config?.FRONT_URL || process.env.FRONT_URL || 'http://localhost:3000').replace(/\/$/, '');
      const cardUrl = subscription.cardToken
        ? `${frontUrl}/api/public/subscription-cards/${subscription.cardToken}`
        : `${frontUrl}/caisse/subscriptions/${subscription.id}`;

      const unitMap: Record<string, string> = {
        DAY: 'Jour(s)',
        WEEK: 'Semaine(s)',
        MONTH: 'Mois',
        YEAR: 'An(s)',
      };
      const durationText = `${subscription.duration} ${unitMap[subscription.unit] || subscription.unit}`;

      const html = await this.fileUploadService.renderTemplate(
        {
          isRenewal,
          clientName,
          subscriptionNumber: formatSubscriptionNumber(subscription.number),
          productName: subscription.productName,
          durationText,
          startDate: formatAuditDate(subscription.startDate),
          endDate: formatAuditDate(subscription.endDate),
          total: Number(subscription.total).toFixed(3),
          cardUrl,
          frontUrl,
        },
        'subscriptionConfirmationClient.ejs',
      );

      const subject = isRenewal
        ? `Renouvellement de votre abonnement — Biblio Squad (${formatSubscriptionNumber(subscription.number)})`
        : `Confirmation de votre abonnement — Biblio Squad (${formatSubscriptionNumber(subscription.number)})`;

      const fromAddress = this.config?.SMTP_SEND || process.env.SMTP_SEND || 'coworking-space@bibliosquad.com';

      await this.emailService.sendMail({
        to: email,
        from: fromAddress,
        subject,
        template: html,
        attachments: [this.emailService.getBiblioSquadLogoAttachment()],
      });

      this.logger.log(
        `E-mail de ${isRenewal ? 'renouvellement' : 'confirmation'} d'abonnement N° ${formatSubscriptionNumber(subscription.number)} envoyé avec succès à ${email}.`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Erreur lors de l'envoi de l'e-mail d'abonnement N° ${formatSubscriptionNumber(subscription.number)} pour le client (${subscription.clientId}) : ${msg}`,
      );
    }
  }
}
