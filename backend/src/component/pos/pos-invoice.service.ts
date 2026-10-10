import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { PaginationData } from 'src/common/pagination/types';
import {
  FetchInvoicesDto,
  InvoicePaymentState,
  SaveInvoiceDto,
} from 'src/dto/pos/posInvoice.dto';
import { AuditService } from '../audit/audit.service';
import {
  buildDocumentLines,
  EPSILON,
  formatInvoiceNumber,
  POS_AUDIT,
  round3,
  STAMP_DUTY,
  sumBy,
  toDateOnly,
} from './pos.utils';

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
} satisfies Prisma.InvoiceInclude;

const detailInclude = {
  ...listInclude,
  lines: { orderBy: { sortOrder: 'asc' } },
  payments: {
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    include: { createdBy: { select: userSelect } },
  },
  saleOrder: { select: { id: true, number: true } },
  subscription: { select: { id: true, number: true } },
  reversedInvoice: { select: { id: true, type: true, year: true, sequence: true } },
  creditNotes: {
    where: { deletedAt: null },
    select: { id: true, type: true, status: true, year: true, sequence: true, total: true },
  },
} satisfies Prisma.InvoiceInclude;

type InvoiceAmounts = {
  type: 'INVOICE' | 'CREDIT_NOTE';
  year: number | null;
  sequence: number | null;
  total: Prisma.Decimal;
  amountPaid: Prisma.Decimal;
};

function paymentState(invoice: InvoiceAmounts): InvoicePaymentState {
  const paid = Number(invoice.amountPaid);
  if (paid <= EPSILON) return 'NOT_PAID';
  return paid + EPSILON >= Number(invoice.total) ? 'PAID' : 'PARTIAL';
}

function withComputed<T extends InvoiceAmounts>(invoice: T) {
  return {
    ...invoice,
    displayNumber: formatInvoiceNumber(invoice.type, invoice.year, invoice.sequence),
    paymentState: paymentState(invoice),
    amountDue: round3(Number(invoice.total) - Number(invoice.amountPaid)),
  };
}

@Injectable()
export class PosInvoiceService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private async log(entityId: string, action: 'CREATE' | 'UPDATE' | 'DELETE', summary: string, actorId?: string) {
    await this.auditService.log({ entityType: POS_AUDIT.invoice, entityId, action, userId: actorId, summary });
  }

  private async findOrThrow(id: string) {
    const invoice = await this.prismaService.invoice.findFirst({
      where: { id, deletedAt: null },
      include: detailInclude,
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  private async assertClientAndProducts(dto: SaveInvoiceDto) {
    const client = await this.prismaService.creditClient.findFirst({
      where: { id: dto.clientId, deletedAt: null },
      select: { id: true },
    });
    if (!client) throw new BadRequestException('Client not found');
    const ids = [...new Set(dto.lines.map((l) => l.productId).filter((id): id is string => !!id))];
    if (!ids.length) return;
    const count = await this.prismaService.posProduct.count({ where: { id: { in: ids }, deletedAt: null } });
    if (count !== ids.length) throw new BadRequestException('Some products are unavailable');
  }

  private async documentData(dto: SaveInvoiceDto) {
    const { lines, untaxed, taxTotal, total } = buildDocumentLines(dto.lines);
    const stampDuty = dto.withStampDuty === false ? 0 : STAMP_DUTY;
    return {
      lines,
      fields: {
        clientId: dto.clientId,
        invoiceDate: toDateOnly(dto.invoiceDate),
        dueDate: dto.dueDate ? toDateOnly(dto.dueDate) : null,
        note: dto.note?.trim() || null,
        untaxed,
        taxTotal,
        stampDuty,
        total: round3(total + stampDuty),
      },
    };
  }

  async list(query: FetchInvoicesDto, pagination: PaginationData) {
    const search = query.search?.trim();
    const total = this.prismaService.invoice.fields.total;
    const paymentFilter: Prisma.InvoiceWhereInput | undefined =
      query.paymentState === 'NOT_PAID'
        ? { amountPaid: { lte: 0 } }
        : query.paymentState === 'PAID'
          ? { amountPaid: { gte: total } }
          : query.paymentState === 'PARTIAL'
            ? { AND: [{ amountPaid: { gt: 0 } }, { amountPaid: { lt: total } }] }
            : undefined;
    let searchSequence: number | undefined;
    let searchYear: number | undefined;
    if (search) {
      const match = search.match(/(?:fac|av)?\/?(?:(\d{4})\/)?0*(\d+)/i);
      if (match) {
        if (match[1]) searchYear = Number(match[1]);
        if (match[2]) searchSequence = Number(match[2]);
      }
    }

    const where: Prisma.InvoiceWhereInput = {
      deletedAt: null,
      ...(query.type && { type: query.type }),
      ...(query.status && { status: query.status }),
      ...(query.clientId && { clientId: query.clientId }),
      ...(query.payable && { type: 'INVOICE', status: 'POSTED', amountPaid: { lt: total } }),
      ...paymentFilter,
      ...(search && {
        OR: [
          ...(searchSequence !== undefined && searchSequence <= 2147483647
            ? [
                searchYear !== undefined
                  ? { AND: [{ year: searchYear }, { sequence: searchSequence }] }
                  : { sequence: searchSequence },
              ]
            : []),
          { client: { firstName: { contains: search, mode: 'insensitive' } } },
          { client: { lastName: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };
    const proxied = ProxyPrismaModel(this.prismaService.invoice as any);
    const result = await proxied.findManyPaginated(
      {
        where,
        orderBy: [{ invoiceDate: 'desc' }, { sequence: 'desc' }, { createdAt: 'desc' }],
        include: listInclude,
      },
      pagination,
    );
    return { ...result, data: (result.data as InvoiceAmounts[]).map(withComputed) };
  }

  async getById(id: string) {
    return withComputed(await this.findOrThrow(id));
  }

  async create(dto: SaveInvoiceDto, actorId?: string) {
    await this.assertClientAndProducts(dto);
    const { lines, fields } = await this.documentData(dto);
    const invoice = await this.prismaService.invoice.create({
      data: { ...fields, lines: { create: lines } },
    });
    await this.log(invoice.id, 'CREATE', 'Created draft invoice', actorId);
    return this.getById(invoice.id);
  }

  async update(id: string, dto: SaveInvoiceDto, actorId?: string) {
    const existing = await this.findOrThrow(id);
    if (existing.status !== 'DRAFT') throw new BadRequestException('Only draft invoices can be edited');
    await this.assertClientAndProducts(dto);
    const { lines, fields } = await this.documentData(dto);
    if (fields.total + EPSILON < Number(existing.amountPaid)) {
      throw new BadRequestException('The total cannot be lower than the amount already paid');
    }
    await this.prismaService.$transaction([
      this.prismaService.invoiceLine.deleteMany({ where: { invoiceId: id } }),
      this.prismaService.invoice.update({
        where: { id },
        data: { ...fields, lines: { create: lines } },
      }),
    ]);
    await this.log(id, 'UPDATE', 'Updated draft invoice', actorId);
    return this.getById(id);
  }

  async post(id: string, actorId?: string) {
    const invoice = await this.findOrThrow(id);
    if (invoice.status !== 'DRAFT') throw new BadRequestException('Only draft invoices can be posted');
    const year = invoice.year ?? invoice.invoiceDate.getUTCFullYear();
    const posted = await this.prismaService.$transaction(async (tx) => {
      let sequence = invoice.sequence;
      if (sequence === null || invoice.year === null) {
        const last = await tx.invoice.aggregate({
          where: { type: invoice.type, year },
          _max: { sequence: true },
        });
        sequence = (last._max.sequence ?? 0) + 1;
      }
      return tx.invoice.update({
        where: { id },
        data: { status: 'POSTED', year, sequence, postedAt: new Date() },
      });
    });
    await this.log(
      id,
      'UPDATE',
      `Posted ${formatInvoiceNumber(posted.type, posted.year, posted.sequence)}`,
      actorId,
    );
    return this.getById(id);
  }

  async resetToDraft(id: string, actorId?: string) {
    const invoice = await this.findOrThrow(id);
    if (invoice.status === 'DRAFT') throw new BadRequestException('Invoice is already a draft');
    if (invoice.payments.length > 0) {
      throw new BadRequestException('Delete the payments before resetting to draft');
    }
    await this.prismaService.invoice.update({ where: { id }, data: { status: 'DRAFT' } });
    await this.log(id, 'UPDATE', 'Invoice reset to draft', actorId);
    return this.getById(id);
  }

  async cancel(id: string, actorId?: string) {
    const invoice = await this.findOrThrow(id);
    if (invoice.status === 'CANCELLED') throw new BadRequestException('Invoice is already cancelled');
    if (invoice.payments.length > 0) {
      throw new BadRequestException('Delete the payments before cancelling');
    }
    await this.prismaService.invoice.update({ where: { id }, data: { status: 'CANCELLED' } });
    await this.log(id, 'UPDATE', 'Invoice cancelled', actorId);
    return this.getById(id);
  }

  async remove(id: string, actorId?: string) {
    const invoice = await this.findOrThrow(id);
    if (invoice.status === 'POSTED') {
      throw new BadRequestException('Posted invoices cannot be deleted');
    }
    if (invoice.payments.length > 0) {
      throw new BadRequestException('Delete the payments first');
    }
    await this.prismaService.invoice.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.log(id, 'DELETE', 'Deleted invoice', actorId);
    return { id };
  }

  async deletePayment(paymentId: string, actorId?: string) {
    const payment = await this.prismaService.invoicePayment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.posOrderLineId) {
      throw new BadRequestException('Register payments must be refunded from the register');
    }
    await this.prismaService.$transaction([
      this.prismaService.invoicePayment.delete({ where: { id: paymentId } }),
      this.prismaService.invoice.update({
        where: { id: payment.invoiceId },
        data: { amountPaid: { decrement: payment.amount } },
      }),
    ]);
    await this.log(payment.invoiceId, 'UPDATE', `Payment of ${payment.amount.toString()} deleted`, actorId);
    return this.getById(payment.invoiceId);
  }

  async createCreditNote(id: string, actorId?: string) {
    const invoice = await this.findOrThrow(id);
    if (invoice.type !== 'INVOICE' || invoice.status !== 'POSTED') {
      throw new BadRequestException('Credit notes can only be created from posted invoices');
    }
    const lines = invoice.lines.map(({ id: _id, invoiceId: _invoiceId, ...line }) => line);
    const creditNote = await this.prismaService.invoice.create({
      data: {
        type: 'CREDIT_NOTE',
        clientId: invoice.clientId,
        saleOrderId: invoice.saleOrderId,
        subscriptionId: invoice.subscriptionId,
        reversedInvoiceId: invoice.id,
        invoiceDate: toDateOnly(new Date()),
        note: `Avoir sur ${formatInvoiceNumber(invoice.type, invoice.year, invoice.sequence)}`,
        untaxed: invoice.untaxed,
        taxTotal: invoice.taxTotal,
        stampDuty: 0,
        total: round3(sumBy(lines, (l) => l.total)),
        lines: { create: lines },
      },
    });
    await this.log(
      creditNote.id,
      'CREATE',
      `Credit note created for ${formatInvoiceNumber(invoice.type, invoice.year, invoice.sequence)}`,
      actorId,
    );
    return this.getById(creditNote.id);
  }
}
