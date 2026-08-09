import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, EQuoteStatus } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQuoteDto, UpdateQuoteDto } from 'src/dto/sales/quote.dto';
import { DocumentLineDto } from 'src/dto/sales/document-line.dto';
import {
  computeDocumentTotals,
  computeLineTotals,
  toDecimal,
} from 'src/common/utils/sales-line.util';
import { DocumentSequenceService } from './document-sequence.service';
import { CustomerService } from './customer.service';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { composeWhere, buildAndFilters } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';

const quoteInclude = {
  customer: true,
  lines: { orderBy: { sortOrder: 'asc' as const } },
  invoice: { select: { id: true, number: true, status: true } },
};

@Injectable()
export class QuoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: DocumentSequenceService,
    private readonly customerService: CustomerService,
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

  async create(dto: CreateQuoteDto) {
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
    const number = await this.sequence.nextNumber('DEV');

    return this.prisma.quote.create({
      data: {
        number,
        customerId: dto.customerId,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        notes: dto.notes?.trim() || null,
        subtotal: toDecimal(totals.subtotal),
        taxTotal: toDecimal(totals.taxTotal),
        total: toDecimal(totals.total),
        lines: { create: lineData },
      },
      include: quoteInclude,
    });
  }

  async getById(id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, deletedAt: null },
      include: quoteInclude,
    });
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }

  async update(id: string, dto: UpdateQuoteDto) {
    const existing = await this.getById(id);
    if (existing.status === EQuoteStatus.CONVERTED) {
      throw new BadRequestException('Cannot edit a converted quote');
    }
    if (dto.customerId) await this.customerService.getById(dto.customerId);

    const data: Prisma.QuoteUpdateInput = {};
    if (dto.customerId) data.customer = { connect: { id: dto.customerId } };
    if (dto.status) data.status = dto.status;
    if (dto.validUntil !== undefined) {
      data.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
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
      data.lines = {
        deleteMany: {},
        create: lineData,
      };
    }

    return this.prisma.quote.update({
      where: { id },
      data,
      include: quoteInclude,
    });
  }

  async delete(id: string) {
    const quote = await this.getById(id);
    if (quote.status === EQuoteStatus.CONVERTED) {
      throw new BadRequestException('Cannot delete a converted quote');
    }
    await this.prisma.quote.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async list(
    pagination: PaginationData,
    orderBy: Record<string, unknown>[],
    searchWhere?: Prisma.QuoteWhereInput,
  ) {
    const andWhere = buildAndFilters<Prisma.QuoteWhereInput>(searchWhere);
    const where = composeWhere({ deletedAt: null }, andWhere) as Prisma.QuoteWhereInput;
    const paginated = ProxyPrismaModel(this.prisma.quote as any);
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
