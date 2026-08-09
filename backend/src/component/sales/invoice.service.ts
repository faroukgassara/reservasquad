import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  Quote,
  EQuoteStatus,
  EInvoiceStatus,
} from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from 'src/dto/sales/invoice.dto';
import { DocumentLineDto } from 'src/dto/sales/document-line.dto';
import {
  computeDocumentTotals,
  computeLineTotals,
  toDecimal,
} from 'src/common/utils/sales-line.util';
import { DocumentSequenceService } from './document-sequence.service';
import { CustomerService } from './customer.service';
import { QuoteService } from './quote.service';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { composeWhere, buildAndFilters } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';

const invoiceInclude = {
  customer: true,
  quote: { select: { id: true, number: true, status: true } },
  lines: { orderBy: { sortOrder: 'asc' as const } },
};

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: DocumentSequenceService,
    private readonly customerService: CustomerService,
    private readonly quoteService: QuoteService,
  ) {}

  private buildLines(lines: DocumentLineDto[]) {
    if (!lines?.length) {
      throw new BadRequestException('At least one line is required');
    }
    return lines.map((line, index) => {
      const computed = computeLineTotals(line);
      return {
        sortOrder: index,
        label: line.label.trim(),
        description: line.description?.trim() || null,
        quantity: toDecimal(computed.quantity),
        unitPrice: toDecimal(computed.unitPrice),
        taxRate: toDecimal(computed.taxRate),
        lineSubtotal: toDecimal(computed.lineSubtotal),
        lineTax: toDecimal(computed.lineTax),
        lineTotal: toDecimal(computed.lineTotal),
      };
    });
  }

  async create(dto: CreateInvoiceDto) {
    await this.customerService.getById(dto.customerId);
    const lineData = this.buildLines(dto.lines);
    const totals = computeDocumentTotals(
      lineData.map((l) => ({
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        taxRate: Number(l.taxRate),
        lineSubtotal: Number(l.lineSubtotal),
        lineTax: Number(l.lineTax),
        lineTotal: Number(l.lineTotal),
      })),
    );
    const number = await this.sequence.nextNumber('FAC');

    return this.prisma.invoice.create({
      data: {
        number,
        customerId: dto.customerId,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        notes: dto.notes?.trim() || null,
        subtotal: toDecimal(totals.subtotal),
        taxTotal: toDecimal(totals.taxTotal),
        total: toDecimal(totals.total),
        lines: { create: lineData },
      },
      include: invoiceInclude,
    });
  }

  async createFromQuote(quoteId: string) {
    const quote = await this.quoteService.getById(quoteId);
    if (quote.invoice) {
      throw new BadRequestException('Quote already converted to invoice');
    }
    if (quote.status === EQuoteStatus.CONVERTED) {
      throw new BadRequestException('Quote already converted');
    }

    const number = await this.sequence.nextNumber('FAC');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await this.prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          number,
          customerId: quote.customerId,
          quoteId: quote.id,
          status: EInvoiceStatus.POSTED,
          issueDate: new Date(),
          dueDate,
          notes: quote.notes,
          subtotal: quote.subtotal,
          taxTotal: quote.taxTotal,
          total: quote.total,
          lines: {
            create: quote.lines.map((line) => ({
              sortOrder: line.sortOrder,
              label: line.label,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxRate: line.taxRate,
              lineSubtotal: line.lineSubtotal,
              lineTax: line.lineTax,
              lineTotal: line.lineTotal,
            })),
          },
        },
        include: invoiceInclude,
      });

      await tx.quote.update({
        where: { id: quote.id },
        data: { status: EQuoteStatus.CONVERTED },
      });

      return created;
    });

    return invoice;
  }

  async getById(id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: invoiceInclude,
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    const existing = await this.getById(id);
    if (existing.status === EInvoiceStatus.PAID) {
      throw new BadRequestException('Cannot edit a paid invoice');
    }
    if (existing.status === EInvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot edit a cancelled invoice');
    }
    if (dto.customerId) await this.customerService.getById(dto.customerId);

    const data: Prisma.InvoiceUpdateInput = {};
    if (dto.customerId) data.customer = { connect: { id: dto.customerId } };
    if (dto.status) data.status = dto.status;
    if (dto.issueDate) data.issueDate = new Date(dto.issueDate);
    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.notes !== undefined) data.notes = dto.notes?.trim() || null;

    if (dto.lines) {
      const lineData = this.buildLines(dto.lines);
      const totals = computeDocumentTotals(
        lineData.map((l) => ({
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          taxRate: Number(l.taxRate),
          lineSubtotal: Number(l.lineSubtotal),
          lineTax: Number(l.lineTax),
          lineTotal: Number(l.lineTotal),
        })),
      );
      data.subtotal = toDecimal(totals.subtotal);
      data.taxTotal = toDecimal(totals.taxTotal);
      data.total = toDecimal(totals.total);
      data.lines = { deleteMany: {}, create: lineData };
    }

    return this.prisma.invoice.update({
      where: { id },
      data,
      include: invoiceInclude,
    });
  }

  async markPaid(id: string) {
    const invoice = await this.getById(id);
    if (invoice.status === EInvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot mark cancelled invoice as paid');
    }
    return this.prisma.invoice.update({
      where: { id },
      data: { status: EInvoiceStatus.PAID },
      include: invoiceInclude,
    });
  }

  async delete(id: string) {
    const invoice = await this.getById(id);
    if (invoice.status === EInvoiceStatus.PAID) {
      throw new BadRequestException('Cannot delete a paid invoice');
    }
    await this.prisma.invoice.update({
      where: { id },
      data: { deletedAt: new Date(), status: EInvoiceStatus.CANCELLED },
    });
  }

  async list(
    pagination: PaginationData,
    orderBy: Record<string, unknown>[],
    searchWhere?: Prisma.InvoiceWhereInput,
  ) {
    const andWhere = buildAndFilters<Prisma.InvoiceWhereInput>(searchWhere);
    const where = composeWhere({ deletedAt: null }, andWhere) as Prisma.InvoiceWhereInput;
    const paginated = ProxyPrismaModel(this.prisma.invoice as any);
    return paginated.findManyPaginated(
      {
        where,
        orderBy,
        include: {
          customer: { select: { id: true, name: true, company: true } },
        },
      },
      pagination,
    );
  }
}
