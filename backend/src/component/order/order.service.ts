import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EOrderStatus, EShippingMethod, Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { DocumentSequenceService } from 'src/component/sales/document-sequence.service';
import { CreateOrderDto } from 'src/dto/order/createOrder.dto';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { buildAndFilters, composeWhere } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';

export const SHIPPING_FEES: Record<EShippingMethod, number> = {
  [EShippingMethod.STANDARD]: 2,
  [EShippingMethod.EXPRESS]: 7,
  [EShippingMethod.PICKUP]: 0,
};

const orderInclude = {
  lines: { orderBy: { sortOrder: 'asc' as const } },
} as const;

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: DocumentSequenceService,
  ) {}

  async create(
    dto: CreateOrderDto,
    options?: {
      userId?: string;
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
    },
  ) {
    const email = (options?.email ?? dto.email).trim().toLowerCase();
    const phone = (options?.phone ?? dto.phone).replaceAll(/\s+/g, '');
    const firstName = (options?.firstName ?? dto.firstName).trim();
    const lastName = (options?.lastName ?? dto.lastName).trim();

    if (!dto.lines?.length) {
      throw new BadRequestException('At least one order line is required');
    }

    const shippingFee = SHIPPING_FEES[dto.shippingMethod];
    if (shippingFee == null) {
      throw new BadRequestException('Invalid shipping method');
    }

    const lineData = dto.lines.map((line, index) => {
      const quantity = Math.max(1, Math.floor(line.quantity));
      const unitPrice = Number(line.unitPrice);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new BadRequestException(`Invalid unit price for line ${index + 1}`);
      }
      const lineTotal = Math.round(unitPrice * quantity * 100) / 100;

      return {
        sortOrder: index,
        productId: line.productId || null,
        productTitle: line.productTitle.trim(),
        productSlug: line.productSlug.trim(),
        imageUrl: line.imageUrl?.trim() || null,
        unitPrice: new Prisma.Decimal(unitPrice),
        quantity,
        material: line.material?.trim() || null,
        size: line.size?.trim() || null,
        engraving: line.engraving?.trim() || null,
        lineTotal: new Prisma.Decimal(lineTotal),
      };
    });

    const subtotal = lineData.reduce((sum, line) => sum + Number(line.lineTotal), 0);
    const total = Math.round((subtotal + shippingFee) * 100) / 100;
    const number = await this.sequence.nextNumber('CMD');

    return this.prisma.order.create({
      data: {
        number,
        status: EOrderStatus.PENDING,
        userId: options?.userId || null,
        firstName,
        lastName,
        email,
        phone,
        address: dto.address.trim(),
        city: dto.city.trim(),
        governorate: dto.governorate.trim(),
        postalCode: dto.postalCode.trim(),
        shippingMethod: dto.shippingMethod,
        shippingFee: new Prisma.Decimal(shippingFee),
        subtotal: new Prisma.Decimal(Math.round(subtotal * 100) / 100),
        total: new Prisma.Decimal(total),
        lines: { create: lineData },
      },
      include: orderInclude,
    });
  }

  async fetchOrders(
    pagination: PaginationData,
    orderBy: Record<string, unknown>[],
    searchWhere?: Prisma.OrderWhereInput,
    status?: EOrderStatus,
  ) {
    const filterWhere: Prisma.OrderWhereInput = {};
    if (status) {
      filterWhere.status = status;
    }

    const andWhere = buildAndFilters(searchWhere, filterWhere);
    const where: Prisma.OrderWhereInput = composeWhere({}, andWhere) as Prisma.OrderWhereInput;

    const proxyModel = ProxyPrismaModel(this.prisma.order as any);
    return proxyModel.findManyPaginated(
      {
        where,
        orderBy,
        include: {
          lines: { select: { id: true } },
        },
      },
      pagination,
    );
  }

  async getById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async updateStatus(id: string, status: EOrderStatus) {
    await this.getById(id);
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: orderInclude,
    });
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.prisma.order.delete({ where: { id } });
  }
}
