import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import { IEnv } from 'src/common/env/env';
import { FileUploadService } from 'src/common/common-services/file-upload.service';
import { EmailService } from 'src/common/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ENewsletterAudience,
  ENewsletterCategory,
  ENewsletterRecipientStatus,
  ENewsletterStatus,
  Prisma,
} from 'src/generated/prisma/client';
import { PaginationData } from 'src/common/pagination/types';
import { IRequest } from 'src/interface/request/request.interface';
import { AuditService } from '../audit/audit.service';
import { CreateNewsletterDto } from 'src/dto/newsletter/createNewsletter.dto';
import { UpdateNewsletterDto } from 'src/dto/newsletter/updateNewsletter.dto';
import { FetchNewslettersDto } from 'src/dto/newsletter/fetchNewsletters.dto';

const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 1000;

const CATEGORY_LABELS: Record<ENewsletterCategory, string> = {
  UPDATE: 'Mise à jour',
  PROMOTION: 'Promotion',
  DIGEST: 'Newsletter',
  EDITORIAL: 'Éditorial',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function autolinkSafe(escapedText: string): string {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  return escapedText.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#253165;text-decoration:underline;font-weight:600;">${url}</a>`;
  });
}

function parseBodyToParagraphs(body: string): string[] {
  const normalized = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawParagraphs = normalized.split(/\n{2,}/);
  return rawParagraphs
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const escaped = escapeHtml(p);
      const withLineBreaks = escaped.replace(/\n/g, '<br />');
      return autolinkSafe(withLineBreaks);
    });
}

function formatNewsletterBody(
  body: string,
  baseUrl?: string,
): { bodyHtml: string; paragraphs: string[] } {
  if (!body) {
    return { bodyHtml: '', paragraphs: [] };
  }

  const normalized = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const isHtml = /<(?:p|div|h[1-6]|ul|ol|li|img|a|strong|b|em|i|u|s|table|thead|tbody|tr|th|td|blockquote|br|hr|span|center)[^>]*>/i.test(
    normalized,
  );

  const mediaBase = (baseUrl || 'http://localhost:4000').replace(/\/$/, '');

  if (isHtml) {
    let processedHtml = normalized
      .replace(/(src|href)=["'](?:\/)?newsletter\/([^"']+)["']/gi, `$1="${mediaBase}/newsletter/$2"`)
      .replace(/(src|href)=["'](?:\/)?assets\/([^"']+)["']/gi, `$1="${mediaBase}/assets/$2"`);

    processedHtml = processedHtml.replace(
      /<img\b(?![^>]*\bstyle=)([^>]*?)>/gi,
      '<img style="max-width:100%;height:auto;border-radius:8px;display:block;margin:12px auto;" $1>',
    );

    return {
      bodyHtml: processedHtml,
      paragraphs: [],
    };
  }

  const paragraphs = parseBodyToParagraphs(normalized);
  const bodyHtml = paragraphs.map((p) => `<p style="margin:0 0 16px 0;">${p}</p>`).join('');

  return {
    bodyHtml,
    paragraphs,
  };
}

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);
  private readonly config?: IEnv;
  private readonly activeSendingIds = new Set<string>();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly fileUploadService: FileUploadService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.config = this.configService.get<IEnv>('env');
  }

  private async log(
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    summary: string,
    actorId?: string,
  ) {
    await this.auditService.log({
      entityType: 'NEWSLETTER',
      entityId,
      action,
      userId: actorId,
      summary,
    });
  }

  private buildAudienceWhere(audience: ENewsletterAudience): Prisma.CreditClientWhereInput {
    const today = new Date();
    const todayDateOnly = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    const baseWhere: Prisma.CreditClientWhereInput = {
      deletedAt: null,
      email: { not: null, notIn: [''] },
      newsletterOptOut: false,
    };

    switch (audience) {
      case ENewsletterAudience.ALL_CLIENTS:
        return baseWhere;

      case ENewsletterAudience.ACTIVE_SUBSCRIBERS:
        return {
          ...baseWhere,
          subscriptions: {
            some: {
              status: 'ACTIVE',
              deletedAt: null,
              endDate: { gte: todayDateOnly },
            },
          },
        };

      case ENewsletterAudience.EXPIRED_SUBSCRIBERS:
        return {
          ...baseWhere,
          subscriptions: {
            some: {
              status: 'ACTIVE',
              deletedAt: null,
              endDate: { lt: todayDateOnly },
            },
            none: {
              status: 'ACTIVE',
              deletedAt: null,
              endDate: { gte: todayDateOnly },
            },
          },
        };

      default:
        return baseWhere;
    }
  }

  async getAudienceCount(audience: ENewsletterAudience): Promise<{ count: number }> {
    if (audience === ENewsletterAudience.SPECIFIC_RECIPIENTS) {
      return { count: 0 };
    }

    if (audience === ENewsletterAudience.ALL_PROFESSORS) {
      const count = await this.prismaService.professor.count({
        where: {
          deletedAt: null,
          email: { not: null, notIn: [''] },
          newsletterOptOut: false,
        },
      });
      return { count };
    }

    const where = this.buildAudienceWhere(audience);
    const count = await this.prismaService.creditClient.count({ where });
    return { count };
  }

  async searchRecipients(search?: string) {
    const s = search?.trim();
    const clientWhere: Prisma.CreditClientWhereInput = {
      deletedAt: null,
      email: { not: null, notIn: [''] },
      newsletterOptOut: false,
      ...(s && {
        OR: [
          { firstName: { contains: s, mode: 'insensitive' } },
          { lastName: { contains: s, mode: 'insensitive' } },
          { email: { contains: s, mode: 'insensitive' } },
          { phone: { contains: s, mode: 'insensitive' } },
        ],
      }),
    };

    const profWhere: Prisma.ProfessorWhereInput = {
      deletedAt: null,
      email: { not: null, notIn: [''] },
      newsletterOptOut: false,
      ...(s && {
        OR: [
          { firstName: { contains: s, mode: 'insensitive' } },
          { lastName: { contains: s, mode: 'insensitive' } },
          { email: { contains: s, mode: 'insensitive' } },
          { phone: { contains: s, mode: 'insensitive' } },
        ],
      }),
    };

    const [clients, professors] = await Promise.all([
      this.prismaService.creditClient.findMany({
        where: clientWhere,
        take: 30,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      }),
      this.prismaService.professor.findMany({
        where: profWhere,
        take: 30,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      }),
    ]);

    return [
      ...clients.map((c) => ({
        id: c.id,
        type: 'CLIENT' as const,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email!,
        phone: c.phone,
      })),
      ...professors.map((p) => ({
        id: p.id,
        type: 'PROFESSOR' as const,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email!,
        phone: p.phone,
      })),
    ];
  }

  async list(query: FetchNewslettersDto, pagination: PaginationData) {
    const search = query.search?.trim();
    const where: Prisma.NewsletterWhereInput = {
      deletedAt: null,
      ...(query.category && { category: query.category }),
      ...(query.audience && { audience: query.audience }),
      ...(query.status && { status: query.status }),
      ...(search && {
        OR: [
          { subject: { contains: search, mode: 'insensitive' } },
          { body: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const take = pagination.perPage ?? 10;
    const page = pagination.page ?? 1;
    const skip = (page - 1) * take;

    const [data, total] = await Promise.all([
      this.prismaService.newsletter.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prismaService.newsletter.count({ where }),
    ]);

    const lastPage = Math.ceil(total / take) || 1;
    return {
      data,
      meta: {
        total,
        currentPage: page,
        perPage: take,
        lastPage,
        prev: page > 1 ? page - 1 : null,
        next: page < lastPage ? page + 1 : null,
        hasMore: page < lastPage,
      },
    };
  }

  async getById(id: string) {
    const newsletter = await this.prismaService.newsletter.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        recipients: {
          orderBy: { createdAt: 'asc' },
          take: 100,
          include: {
            client: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            professor: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!newsletter) {
      throw new NotFoundException('Newsletter introuvable.');
    }

    const [specificClients, specificProfessors] = await Promise.all([
      newsletter.specificClientIds && newsletter.specificClientIds.length > 0
        ? this.prismaService.creditClient.findMany({
            where: { id: { in: newsletter.specificClientIds } },
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          })
        : [],
      newsletter.specificProfessorIds && newsletter.specificProfessorIds.length > 0
        ? this.prismaService.professor.findMany({
            where: { id: { in: newsletter.specificProfessorIds } },
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          })
        : [],
    ]);

    return {
      ...newsletter,
      specificClients,
      specificProfessors,
    };
  }

  async create(dto: CreateNewsletterDto, userId?: string) {
    const newsletter = await this.prismaService.newsletter.create({
      data: {
        subject: dto.subject.trim(),
        preheader: dto.preheader?.trim() || null,
        body: dto.body.trim(),
        ctaLabel: dto.ctaLabel?.trim() || null,
        ctaUrl: dto.ctaUrl?.trim() || null,
        category: dto.category,
        audience: dto.audience,
        specificClientIds: dto.specificClientIds || [],
        specificProfessorIds: dto.specificProfessorIds || [],
        specificEmails: dto.specificEmails || [],
        status: ENewsletterStatus.DRAFT,
        createdById: userId || null,
      },
    });

    await this.log(
      newsletter.id,
      'CREATE',
      `Brouillon de newsletter créé : "${newsletter.subject}"`,
      userId,
    );

    return newsletter;
  }

  async update(id: string, dto: UpdateNewsletterDto, userId?: string) {
    const existing = await this.prismaService.newsletter.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Newsletter introuvable.');
    }

    if (existing.status !== ENewsletterStatus.DRAFT) {
      throw new BadRequestException(
        'Seuls les brouillons de newsletter peuvent être modifiés.',
      );
    }

    const updated = await this.prismaService.newsletter.update({
      where: { id },
      data: {
        ...(dto.subject !== undefined && { subject: dto.subject.trim() }),
        ...(dto.preheader !== undefined && {
          preheader: dto.preheader?.trim() || null,
        }),
        ...(dto.body !== undefined && { body: dto.body.trim() }),
        ...(dto.ctaLabel !== undefined && {
          ctaLabel: dto.ctaLabel?.trim() || null,
        }),
        ...(dto.ctaUrl !== undefined && { ctaUrl: dto.ctaUrl?.trim() || null }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.audience !== undefined && { audience: dto.audience }),
        ...(dto.specificClientIds !== undefined && {
          specificClientIds: dto.specificClientIds,
        }),
        ...(dto.specificProfessorIds !== undefined && {
          specificProfessorIds: dto.specificProfessorIds,
        }),
        ...(dto.specificEmails !== undefined && {
          specificEmails: dto.specificEmails,
        }),
      },
    });

    await this.log(
      updated.id,
      'UPDATE',
      `Brouillon de newsletter modifié : "${updated.subject}"`,
      userId,
    );

    return updated;
  }

  async remove(id: string, userId?: string) {
    const existing = await this.prismaService.newsletter.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Newsletter introuvable.');
    }

    if (existing.status !== ENewsletterStatus.DRAFT) {
      throw new BadRequestException(
        'Seuls les brouillons de newsletter peuvent être supprimés.',
      );
    }

    await this.prismaService.newsletter.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.log(
      id,
      'DELETE',
      `Brouillon de newsletter supprimé : "${existing.subject}"`,
      userId,
    );

    return { id, success: true };
  }

  async getDeletedNewsletterById(id: string) {
    const newsletter = await this.prismaService.newsletter.findFirst({
      where: { id, deletedAt: { not: null } },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    if (!newsletter) {
      throw new NotFoundException('Newsletter supprimée introuvable.');
    }
    return newsletter;
  }

  async listDeletedNewsletters(pagination: PaginationData, query?: FetchNewslettersDto) {
    const search = query?.search?.trim();
    const where: Prisma.NewsletterWhereInput = {
      deletedAt: { not: null },
      ...(query?.category && { category: query.category }),
      ...(query?.audience && { audience: query.audience }),
      ...(query?.status && { status: query.status }),
      ...(search && {
        OR: [
          { subject: { contains: search, mode: 'insensitive' } },
          { body: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const take = pagination.perPage ?? 10;
    const page = pagination.page ?? 1;
    const skip = (page - 1) * take;

    const [data, total] = await Promise.all([
      this.prismaService.newsletter.findMany({
        where,
        skip,
        take,
        orderBy: { deletedAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prismaService.newsletter.count({ where }),
    ]);

    const lastPage = Math.ceil(total / take) || 1;
    return {
      data,
      meta: {
        total,
        currentPage: page,
        perPage: take,
        lastPage,
        prev: page > 1 ? page - 1 : null,
        next: page < lastPage ? page + 1 : null,
        hasMore: page < lastPage,
      },
    };
  }

  async restoreNewsletter(id: string, userId?: string) {
    const existing = await this.getDeletedNewsletterById(id);
    const restored = await this.prismaService.newsletter.update({
      where: { id },
      data: { deletedAt: null },
    });
    await this.log(
      id,
      'UPDATE',
      `Newsletter restaurée : "${existing.subject}"`,
      userId,
    );
    return restored;
  }

  async hardDeleteNewsletter(id: string, userId?: string) {
    const existing = await this.getDeletedNewsletterById(id);
    const removed = await this.prismaService.newsletter.delete({
      where: { id },
    });
    await this.log(
      id,
      'DELETE',
      `Newsletter supprimée définitivement : "${existing.subject}"`,
      userId,
    );
    return removed;
  }

  async uploadMedia(file: Express.Multer.File, req?: IRequest) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni.');
    }

    const relativePath = await this.fileUploadService.upload('newsletter', file);

    const protocol = (req?.headers?.['x-forwarded-proto'] as string) || req?.protocol || 'http';
    const host = (req?.headers?.['x-forwarded-host'] as string) || req?.get?.('host') || 'localhost:4000';
    const baseUrl = (
      process.env.BACKEND_PUBLIC_URL ||
      process.env.BACKEND_URL ||
      `${protocol}://${host}`
    ).replace(/\/$/, '');

    const fullUrl = `${baseUrl}/${relativePath}`;

    return {
      url: fullUrl,
      path: relativePath,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async sendTest(id: string, testEmail: string) {
    const newsletter = await this.prismaService.newsletter.findFirst({
      where: { id, deletedAt: null },
    });

    if (!newsletter) {
      throw new NotFoundException('Newsletter introuvable.');
    }

    const frontUrl = (
      this.config?.FRONT_URL ||
      process.env.FRONT_URL ||
      'http://localhost:3000'
    ).replace(/\/$/, '');

    const baseUrl = (
      process.env.BACKEND_PUBLIC_URL ||
      process.env.BACKEND_URL ||
      'http://localhost:4000'
    ).replace(/\/$/, '');

    const { bodyHtml, paragraphs } = formatNewsletterBody(newsletter.body, baseUrl);
    const categoryLabel = CATEGORY_LABELS[newsletter.category] || '';
    const dummyToken = 'demo-test-token-preview';
    const unsubscribeUrl = `${frontUrl}/fr/newsletter/unsubscribe/${dummyToken}`;

    const html = await this.fileUploadService.renderTemplate(
      {
        subject: `[TEST] ${newsletter.subject}`,
        preheader: newsletter.preheader,
        bodyHtml,
        paragraphs,
        categoryLabel,
        ctaLabel: newsletter.ctaLabel,
        ctaUrl: newsletter.ctaUrl,
        unsubscribeUrl,
        frontUrl,
      },
      'newsletterClient.ejs',
    );

    const fromAddress =
      this.config?.SMTP_SEND ||
      process.env.SMTP_SEND ||
      'coworking-space@bibliosquad.com';

    const result = await this.emailService.sendMail({
      to: testEmail.trim(),
      from: fromAddress,
      subject: `[TEST] ${newsletter.subject}`,
      template: html,
      attachments: [this.emailService.getBiblioSquadLogoAttachment()],
    });

    if (!result) {
      throw new BadRequestException(
        `Impossible d'envoyer l'e-mail de test à ${testEmail}. Vérifiez la configuration SMTP.`,
      );
    }

    return { success: true, email: testEmail };
  }

  async send(id: string, userId?: string) {
    const newsletter = await this.prismaService.newsletter.findFirst({
      where: { id, deletedAt: null },
    });

    if (!newsletter) {
      throw new NotFoundException('Newsletter introuvable.');
    }

    if (newsletter.status !== ENewsletterStatus.DRAFT) {
      throw new BadRequestException(
        `Cette newsletter ne peut pas être envoyée (statut actuel : ${newsletter.status}).`,
      );
    }

    // 0. Audience SPECIFIC_RECIPIENTS
    if (newsletter.audience === ENewsletterAudience.SPECIFIC_RECIPIENTS) {
      const clientIds = newsletter.specificClientIds || [];
      const profIds = newsletter.specificProfessorIds || [];
      const extraEmails = (newsletter.specificEmails || [])
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      const [clients, professors] = await Promise.all([
        clientIds.length > 0
          ? this.prismaService.creditClient.findMany({
              where: {
                id: { in: clientIds },
                deletedAt: null,
                email: { not: null, notIn: [''] },
                newsletterOptOut: false,
              },
              select: { id: true, email: true, newsletterToken: true },
            })
          : [],
        profIds.length > 0
          ? this.prismaService.professor.findMany({
              where: {
                id: { in: profIds },
                deletedAt: null,
                email: { not: null, notIn: [''] },
                newsletterOptOut: false,
              },
              select: { id: true, email: true, newsletterToken: true },
            })
          : [],
      ]);

      const seenEmails = new Set<string>();
      const recipientsData: Array<{
        newsletterId: string;
        clientId?: string | null;
        professorId?: string | null;
        email: string;
        status: ENewsletterRecipientStatus;
      }> = [];

      for (const c of clients) {
        const email = c.email?.trim().toLowerCase();
        if (email && email.includes('@') && !seenEmails.has(email)) {
          seenEmails.add(email);
          if (!c.newsletterToken) {
            const token = crypto.randomBytes(24).toString('hex');
            await this.prismaService.creditClient.update({
              where: { id: c.id },
              data: { newsletterToken: token },
            });
            c.newsletterToken = token;
          }
          recipientsData.push({
            newsletterId: id,
            clientId: c.id,
            email: c.email!.trim(),
            status: ENewsletterRecipientStatus.PENDING,
          });
        }
      }

      for (const p of professors) {
        const email = p.email?.trim().toLowerCase();
        if (email && email.includes('@') && !seenEmails.has(email)) {
          seenEmails.add(email);
          if (!p.newsletterToken) {
            const token = crypto.randomBytes(24).toString('hex');
            await this.prismaService.professor.update({
              where: { id: p.id },
              data: { newsletterToken: token },
            });
            p.newsletterToken = token;
          }
          recipientsData.push({
            newsletterId: id,
            professorId: p.id,
            email: p.email!.trim(),
            status: ENewsletterRecipientStatus.PENDING,
          });
        }
      }

      for (const email of extraEmails) {
        if (email.includes('@') && !seenEmails.has(email)) {
          seenEmails.add(email);
          recipientsData.push({
            newsletterId: id,
            email,
            status: ENewsletterRecipientStatus.PENDING,
          });
        }
      }

      if (recipientsData.length === 0) {
        throw new BadRequestException(
          "Aucun destinataire valide n'a été spécifié pour cette newsletter.",
        );
      }

      await this.prismaService.newsletterRecipient.createMany({
        data: recipientsData,
        skipDuplicates: true,
      });

      const updatedNewsletter = await this.prismaService.newsletter.update({
        where: { id },
        data: {
          status: ENewsletterStatus.SENDING,
          recipientsCount: recipientsData.length,
          sentCount: 0,
          failedCount: 0,
          sentAt: new Date(),
        },
      });

      await this.log(
        id,
        'UPDATE',
        `Démarrage de l'envoi de la newsletter "${newsletter.subject}" à ${recipientsData.length} destinataire(s) spécifique(s)`,
        userId,
      );

      setImmediate(() => {
        this.processSendingLoop(id).catch((err) => {
          this.logger.error(`Error in processSendingLoop for newsletter ${id}`, err);
        });
      });

      return updatedNewsletter;
    }

    // 1. Audience ALL_PROFESSORS
    if (newsletter.audience === ENewsletterAudience.ALL_PROFESSORS) {
      const professors = await this.prismaService.professor.findMany({
        where: {
          deletedAt: null,
          email: { not: null, notIn: [''] },
          newsletterOptOut: false,
        },
        select: { id: true, email: true, newsletterToken: true },
      });

      const validProfessors = professors.filter(
        (p) => p.email && p.email.trim().includes('@'),
      );

      if (validProfessors.length === 0) {
        throw new BadRequestException(
          "Aucun professeur éligible avec une adresse e-mail valide n'a été trouvé pour cette audience.",
        );
      }

      for (const p of validProfessors) {
        if (!p.newsletterToken) {
          const token = crypto.randomBytes(24).toString('hex');
          await this.prismaService.professor.update({
            where: { id: p.id },
            data: { newsletterToken: token },
          });
          p.newsletterToken = token;
        }
      }

      await this.prismaService.newsletterRecipient.createMany({
        data: validProfessors.map((p) => ({
          newsletterId: id,
          professorId: p.id,
          email: p.email!.trim(),
          status: ENewsletterRecipientStatus.PENDING,
        })),
        skipDuplicates: true,
      });

      const updatedNewsletter = await this.prismaService.newsletter.update({
        where: { id },
        data: {
          status: ENewsletterStatus.SENDING,
          recipientsCount: validProfessors.length,
          sentCount: 0,
          failedCount: 0,
          sentAt: new Date(),
        },
      });

      await this.log(
        id,
        'UPDATE',
        `Démarrage de l'envoi de la newsletter "${newsletter.subject}" à ${validProfessors.length} professeur(s)`,
        userId,
      );

      setImmediate(() => {
        this.processSendingLoop(id).catch((err) => {
          this.logger.error(`Error in processSendingLoop for newsletter ${id}`, err);
        });
      });

      return updatedNewsletter;
    }

    // 2. Client audiences (ALL_CLIENTS, ACTIVE_SUBSCRIBERS, EXPIRED_SUBSCRIBERS)
    const audienceWhere = this.buildAudienceWhere(newsletter.audience);
    const clients = await this.prismaService.creditClient.findMany({
      where: audienceWhere,
      select: { id: true, email: true, newsletterToken: true },
    });

    const validClients = clients.filter(
      (c) => c.email && c.email.trim().includes('@'),
    );

    if (validClients.length === 0) {
      throw new BadRequestException(
        "Aucun destinataire éligible avec une adresse e-mail valide n'a été trouvé pour cette audience.",
      );
    }

    // 2. Ensure each client has a unique newsletterToken for unsubscribe link
    for (const c of validClients) {
      if (!c.newsletterToken) {
        const token = crypto.randomBytes(24).toString('hex');
        await this.prismaService.creditClient.update({
          where: { id: c.id },
          data: { newsletterToken: token },
        });
        c.newsletterToken = token;
      }
    }

    // 3. Create NewsletterRecipient records with PENDING status in bulk
    await this.prismaService.newsletterRecipient.createMany({
      data: validClients.map((c) => ({
        newsletterId: id,
        clientId: c.id,
        email: c.email!.trim(),
        status: ENewsletterRecipientStatus.PENDING,
      })),
      skipDuplicates: true,
    });

    // 4. Mark newsletter as SENDING
    const updatedNewsletter = await this.prismaService.newsletter.update({
      where: { id },
      data: {
        status: ENewsletterStatus.SENDING,
        recipientsCount: validClients.length,
        sentCount: 0,
        failedCount: 0,
        sentAt: new Date(),
      },
    });

    await this.log(
      id,
      'UPDATE',
      `Lancement de l'envoi de la newsletter "${newsletter.subject}" à ${validClients.length} destinataire(s)`,
      userId,
    );

    // 5. Trigger background batch sender (fire and forget, unawaited)
    setImmediate(() => {
      this.processSendingLoop(id).catch((err) => {
        this.logger.error(
          `Erreur inattendue dans le traitement d'envoi de la newsletter ${id}`,
          err,
        );
      });
    });

    return updatedNewsletter;
  }

  /**
   * Background batch processing loop.
   * Sends emails in batches of 20 with a 1s pause between batches.
   */
  async processSendingLoop(newsletterId: string) {
    if (this.activeSendingIds.has(newsletterId)) {
      this.logger.warn(`Newsletter ${newsletterId} is already being processed.`);
      return;
    }

    this.activeSendingIds.add(newsletterId);

    try {
      const newsletter = await this.prismaService.newsletter.findFirst({
        where: { id: newsletterId, deletedAt: null },
      });

      if (!newsletter || newsletter.status !== ENewsletterStatus.SENDING) {
        return;
      }

      const frontUrl = (
        this.config?.FRONT_URL ||
        process.env.FRONT_URL ||
        'http://localhost:3000'
      ).replace(/\/$/, '');

      const fromAddress =
        this.config?.SMTP_SEND ||
        process.env.SMTP_SEND ||
        'coworking-space@bibliosquad.com';

      const baseUrl = (
        process.env.BACKEND_PUBLIC_URL ||
        process.env.BACKEND_URL ||
        'http://localhost:4000'
      ).replace(/\/$/, '');

      const { bodyHtml, paragraphs } = formatNewsletterBody(newsletter.body, baseUrl);
      const categoryLabel = CATEGORY_LABELS[newsletter.category] || '';

      this.logger.log(`Starting batch sending for newsletter ${newsletter.id} ("${newsletter.subject}")...`);

      let hasMore = true;

      while (hasMore) {
        const pendingRecipients = await this.prismaService.newsletterRecipient.findMany({
          where: {
            newsletterId,
            status: ENewsletterRecipientStatus.PENDING,
          },
          take: BATCH_SIZE,
          include: {
            client: {
              select: { id: true, firstName: true, lastName: true, newsletterToken: true, newsletterOptOut: true },
            },
            professor: {
              select: { id: true, firstName: true, lastName: true, newsletterToken: true, newsletterOptOut: true },
            },
          },
        });

        if (pendingRecipients.length === 0) {
          hasMore = false;
          break;
        }

        for (const recipient of pendingRecipients) {
          // If recipient has opted out since the job started, mark FAILED / skipped
          const isOptedOut = recipient.client?.newsletterOptOut || recipient.professor?.newsletterOptOut;
          if (isOptedOut) {
            await this.prismaService.newsletterRecipient.update({
              where: { id: recipient.id },
              data: {
                status: ENewsletterRecipientStatus.FAILED,
                error: 'Destinataire désinscrit',
              },
            });
            await this.prismaService.newsletter.update({
              where: { id: newsletterId },
              data: { failedCount: { increment: 1 } },
            });
            continue;
          }

          const token = recipient.client?.newsletterToken || recipient.professor?.newsletterToken || 'optout';
          const unsubscribeUrl = `${frontUrl}/fr/newsletter/unsubscribe/${token}`;

          try {
            const html = await this.fileUploadService.renderTemplate(
              {
                subject: newsletter.subject,
                preheader: newsletter.preheader,
                bodyHtml,
                paragraphs,
                categoryLabel,
                ctaLabel: newsletter.ctaLabel,
                ctaUrl: newsletter.ctaUrl,
                unsubscribeUrl,
                frontUrl,
              },
              'newsletterClient.ejs',
            );

            const sendRes = await this.emailService.sendMail({
              to: recipient.email,
              from: fromAddress,
              subject: newsletter.subject,
              template: html,
              attachments: [this.emailService.getBiblioSquadLogoAttachment()],
            });

            if (!sendRes) {
              throw new Error("L'envoi SMTP a retourné une erreur");
            }

            await this.prismaService.newsletterRecipient.update({
              where: { id: recipient.id },
              data: {
                status: ENewsletterRecipientStatus.SENT,
                sentAt: new Date(),
                error: null,
              },
            });

            await this.prismaService.newsletter.update({
              where: { id: newsletterId },
              data: { sentCount: { increment: 1 } },
            });
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err);
            await this.prismaService.newsletterRecipient.update({
              where: { id: recipient.id },
              data: {
                status: ENewsletterRecipientStatus.FAILED,
                error: errMsg.slice(0, 500),
              },
            });

            await this.prismaService.newsletter.update({
              where: { id: newsletterId },
              data: { failedCount: { increment: 1 } },
            });
          }
        }

        // Pause between batches to avoid flooding SMTP server
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }

      // Finalize newsletter status
      const finalNewsletter = await this.prismaService.newsletter.findUnique({
        where: { id: newsletterId },
      });

      if (finalNewsletter) {
        const finalStatus =
          finalNewsletter.sentCount === 0 && finalNewsletter.failedCount > 0
            ? ENewsletterStatus.FAILED
            : ENewsletterStatus.SENT;

        await this.prismaService.newsletter.update({
          where: { id: newsletterId },
          data: { status: finalStatus },
        });

        this.logger.log(
          `Newsletter ${newsletterId} finished with status ${finalStatus}: ${finalNewsletter.sentCount} sent, ${finalNewsletter.failedCount} failed out of ${finalNewsletter.recipientsCount}.`,
        );

        await this.log(
          newsletterId,
          'UPDATE',
          `Envoi terminé pour "${finalNewsletter.subject}" : ${finalNewsletter.sentCount} envoyé(s), ${finalNewsletter.failedCount} échec(s)`,
        );
      }
    } finally {
      this.activeSendingIds.delete(newsletterId);
    }
  }

  /**
   * Resumes any pending newsletters that were interrupted (e.g. server restart).
   */
  async resumePendingNewsletters() {
    const pendingNewsletters = await this.prismaService.newsletter.findMany({
      where: {
        status: ENewsletterStatus.SENDING,
        deletedAt: null,
      },
      select: { id: true, subject: true },
    });

    if (pendingNewsletters.length === 0) return;

    this.logger.log(`Resuming ${pendingNewsletters.length} interrupted newsletter(s)...`);

    for (const nl of pendingNewsletters) {
      if (!this.activeSendingIds.has(nl.id)) {
        setImmediate(() => {
          this.processSendingLoop(nl.id).catch((err) => {
            this.logger.error(`Error resuming newsletter ${nl.id}`, err);
          });
        });
      }
    }
  }

  /**
   * Public unsubscribe: retrieve client info by unguessable token.
   */
  async getUnsubscribeInfo(token: string) {
    if (!token || token.length < 10) {
      throw new NotFoundException('Lien de désinscription invalide.');
    }

    const client = await this.prismaService.creditClient.findFirst({
      where: { newsletterToken: token, deletedAt: null },
      select: { id: true, email: true, newsletterOptOut: true },
    });

    if (client && client.email) {
      return {
        maskedEmail: maskEmail(client.email),
        optedOut: client.newsletterOptOut,
      };
    }

    const professor = await this.prismaService.professor.findFirst({
      where: { newsletterToken: token, deletedAt: null },
      select: { id: true, email: true, newsletterOptOut: true },
    });

    if (professor && professor.email) {
      return {
        maskedEmail: maskEmail(professor.email),
        optedOut: professor.newsletterOptOut,
      };
    }

    throw new NotFoundException('Destinataire introuvable ou lien expiré.');
  }

  /**
   * Public unsubscribe: confirm opt-out.
   */
  async unsubscribeByToken(token: string) {
    if (!token || token.length < 10) {
      throw new NotFoundException('Lien de désinscription invalide.');
    }

    const client = await this.prismaService.creditClient.findFirst({
      where: { newsletterToken: token, deletedAt: null },
      select: { id: true, email: true },
    });

    if (client) {
      await this.prismaService.creditClient.update({
        where: { id: client.id },
        data: { newsletterOptOut: true },
      });

      return {
        success: true,
        maskedEmail: maskEmail(client.email || ''),
      };
    }

    const professor = await this.prismaService.professor.findFirst({
      where: { newsletterToken: token, deletedAt: null },
      select: { id: true, email: true },
    });

    if (professor) {
      await this.prismaService.professor.update({
        where: { id: professor.id },
        data: { newsletterOptOut: true },
      });

      return {
        success: true,
        maskedEmail: maskEmail(professor.email || ''),
      };
    }

    throw new NotFoundException('Destinataire introuvable ou lien expiré.');
  }
}
