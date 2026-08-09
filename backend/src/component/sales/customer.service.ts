import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Customer } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from 'src/dto/sales/customer.dto';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { buildAndFilters, composeWhere } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    return this.prisma.customer.create({
      data: {
        type: dto.type,
        name: dto.name.trim(),
        email: dto.email?.trim() || null,
        phone: dto.phone?.replaceAll(/\s+/g, '') || null,
        company: dto.company?.trim() || null,
        vatNumber: dto.vatNumber?.trim() || null,
        address: dto.address?.trim() || null,
        city: dto.city?.trim() || null,
        postalCode: dto.postalCode?.trim() || null,
        country: dto.country?.trim() || 'Tunisie',
      },
    });
  }

  async getById(id: string): Promise<Customer> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    await this.getById(id);
    return this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.email !== undefined && { email: dto.email?.trim() || null }),
        ...(dto.phone !== undefined && { phone: dto.phone?.replaceAll(/\s+/g, '') || null }),
        ...(dto.company !== undefined && { company: dto.company?.trim() || null }),
        ...(dto.vatNumber !== undefined && { vatNumber: dto.vatNumber?.trim() || null }),
        ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
        ...(dto.city !== undefined && { city: dto.city?.trim() || null }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode?.trim() || null }),
        ...(dto.country !== undefined && { country: dto.country?.trim() || null }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }

  async list(
    pagination: PaginationData,
    orderBy: Record<string, unknown>[],
    searchWhere?: Prisma.CustomerWhereInput,
  ) {
    const andWhere = buildAndFilters<Prisma.CustomerWhereInput>(searchWhere);
    const where = composeWhere(
      { deletedAt: null },
      andWhere,
    ) as Prisma.CustomerWhereInput;

    const paginated = ProxyPrismaModel(this.prisma.customer as any);
    return paginated.findManyPaginated({ where, orderBy }, pagination);
  }

  async listAll() {
    return this.prisma.customer.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
  }
}
