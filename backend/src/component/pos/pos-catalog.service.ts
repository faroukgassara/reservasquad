import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { PaginationData } from 'src/common/pagination/types';
import { FileUploadService } from 'src/common/common-services/file-upload.service';
import {
  CreatePosCategoryDto,
  CreatePosProductDto,
  CreatePosStockEntryDto,
  FetchPosProductsDto,
  UpdatePosCategoryDto,
  UpdatePosProductDto,
} from 'src/dto/pos/posCatalog.dto';
import { AuditService } from '../audit/audit.service';
import { POS_AUDIT, round3 } from './pos.utils';

const CATEGORY_IMAGES_TYPE = 'pos-categories';
const PRODUCT_IMAGES_TYPE = 'pos-products';

const categorySelect = { id: true, name: true, imageUrl: true } satisfies Prisma.PosCategorySelect;

function isBase64DataUrl(value: string): boolean {
  return value.startsWith('data:image/') && value.includes(';base64,');
}

function trimOrNull(value?: string | null): string | null {
  return value?.trim() || null;
}

/** A product is a subscription only when both duration and unit are set. */
function subscriptionPeriod(dto: Pick<CreatePosProductDto, 'subscriptionDuration' | 'subscriptionUnit'>) {
  const complete = !!dto.subscriptionDuration && !!dto.subscriptionUnit;
  return {
    subscriptionDuration: complete ? dto.subscriptionDuration! : null,
    subscriptionUnit: complete ? dto.subscriptionUnit! : null,
  };
}

@Injectable()
export class PosCatalogService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileUploadService: FileUploadService,
    private readonly auditService: AuditService,
  ) {}

  private async resolveImage(type: string, value?: string | null): Promise<string | null> {
    if (!value?.trim()) return null;
    if (isBase64DataUrl(value)) {
      return this.fileUploadService.convertBase64(type, value);
    }
    return value.trim();
  }

  private async log(
    entityType: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    summary: string,
    actorId?: string,
  ) {
    await this.auditService.log({ entityType, entityId, action, userId: actorId, summary });
  }

  private async assertCategory(categoryId?: string | null) {
    if (!categoryId) return;
    const category = await this.prismaService.posCategory.findFirst({
      where: { id: categoryId, deletedAt: null },
      select: { id: true },
    });
    if (!category) throw new BadRequestException('Category not found');
  }

  // Categories

  async listCategories() {
    const categories = await this.prismaService.posCategory.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { products: { where: { deletedAt: null } } } },
      },
    });
    return categories.map(({ _count, ...category }) => ({
      ...category,
      productCount: _count.products,
    }));
  }

  async getCategoryById(id: string) {
    const category = await this.prismaService.posCategory.findFirst({
      where: { id, deletedAt: null },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async createCategory(dto: CreatePosCategoryDto, actorId?: string) {
    const category = await this.prismaService.posCategory.create({
      data: {
        name: dto.name.trim(),
        sortOrder: dto.sortOrder ?? 0,
        imageUrl: await this.resolveImage(CATEGORY_IMAGES_TYPE, dto.imageUrl),
      },
    });
    await this.log(POS_AUDIT.category, category.id, 'CREATE', `Created POS category ${category.name}`, actorId);
    return category;
  }

  async updateCategory(id: string, dto: UpdatePosCategoryDto, actorId?: string) {
    await this.getCategoryById(id);
    const data: Prisma.PosCategoryUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
    };
    if (dto.imageUrl !== undefined) {
      data.imageUrl = await this.resolveImage(CATEGORY_IMAGES_TYPE, dto.imageUrl);
    }
    const category = await this.prismaService.posCategory.update({ where: { id }, data });
    await this.log(POS_AUDIT.category, category.id, 'UPDATE', `Updated POS category ${category.name}`, actorId);
    return category;
  }

  async deleteCategory(id: string, actorId?: string) {
    await this.getCategoryById(id);
    const [category] = await this.prismaService.$transaction([
      this.prismaService.posCategory.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      this.prismaService.posProduct.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      }),
    ]);
    await this.log(POS_AUDIT.category, category.id, 'DELETE', `Deleted POS category ${category.name}`, actorId);
    return category;
  }

  // Products

  async listProducts(
    query: FetchPosProductsDto,
    pagination: PaginationData,
    orderBy: Record<string, unknown>[],
  ) {
    const search = query.search?.trim();
    const where: Prisma.PosProductWhereInput = {
      deletedAt: null,
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.availableInPos !== undefined && { availableInPos: query.availableInPos }),
      ...(query.subscription && { subscriptionDuration: { not: null }, subscriptionUnit: { not: null } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
          { reference: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const proxied = ProxyPrismaModel(this.prismaService.posProduct as any);
    return proxied.findManyPaginated(
      { where, orderBy, include: { category: { select: categorySelect } } },
      pagination,
    );
  }

  async listAvailableProducts() {
    return this.prismaService.posProduct.findMany({
      where: { deletedAt: null, availableInPos: true, subscriptionDuration: null },
      orderBy: { name: 'asc' },
      include: { category: { select: categorySelect } },
    });
  }

  async getProductById(id: string) {
    const product = await this.prismaService.posProduct.findFirst({
      where: { id, deletedAt: null },
      include: { category: { select: categorySelect } },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(dto: CreatePosProductDto, actorId?: string) {
    await this.assertCategory(dto.categoryId);
    const period = subscriptionPeriod(dto);
    const product = await this.prismaService.posProduct.create({
      data: {
        name: dto.name.trim(),
        categoryId: dto.categoryId || null,
        price: dto.price,
        cost: dto.cost ?? 0,
        ...(dto.type && { type: dto.type }),
        availableInPos: !period.subscriptionDuration && (dto.availableInPos ?? true),
        barcode: trimOrNull(dto.barcode),
        reference: trimOrNull(dto.reference),
        imageUrl: await this.resolveImage(PRODUCT_IMAGES_TYPE, dto.imageUrl),
        taxRate: dto.taxRate ?? 0,
        ...period,
      },
    });
    await this.log(POS_AUDIT.product, product.id, 'CREATE', `Created POS product ${product.name}`, actorId);
    return product;
  }

  async updateProduct(id: string, dto: UpdatePosProductDto, actorId?: string) {
    const existing = await this.getProductById(id);
    if (dto.categoryId !== undefined) await this.assertCategory(dto.categoryId);
    const periodChanged = dto.subscriptionDuration !== undefined || dto.subscriptionUnit !== undefined;
    const isSubscription = periodChanged ? !!subscriptionPeriod(dto).subscriptionDuration : !!existing.subscriptionDuration;
    const data: Prisma.PosProductUncheckedUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId || null }),
      ...(dto.price !== undefined && { price: dto.price }),
      ...(dto.cost !== undefined && { cost: dto.cost }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.availableInPos !== undefined && { availableInPos: dto.availableInPos }),
      ...(dto.barcode !== undefined && { barcode: trimOrNull(dto.barcode) }),
      ...(dto.reference !== undefined && { reference: trimOrNull(dto.reference) }),
      ...(dto.taxRate !== undefined && { taxRate: dto.taxRate }),
      ...(periodChanged && subscriptionPeriod(dto)),
      ...(isSubscription && { availableInPos: false }),
    };
    if (dto.imageUrl !== undefined) {
      data.imageUrl = await this.resolveImage(PRODUCT_IMAGES_TYPE, dto.imageUrl);
    }
    const product = await this.prismaService.posProduct.update({ where: { id }, data });
    await this.log(POS_AUDIT.product, product.id, 'UPDATE', `Updated POS product ${product.name}`, actorId);
    return product;
  }

  async deleteProduct(id: string, actorId?: string) {
    await this.getProductById(id);
    const product = await this.prismaService.posProduct.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.log(POS_AUDIT.product, product.id, 'DELETE', `Deleted POS product ${product.name}`, actorId);
    return product;
  }

  async getProductStats(id: string) {
    const product = await this.getProductById(id);
    const [bought, soldInPos, soldInSaleOrders, soldOnCredit] = await Promise.all([
      this.prismaService.posStockEntry.aggregate({
        where: { productId: id },
        _sum: { quantity: true },
      }),
      this.prismaService.posOrderLine.aggregate({
        where: { productId: id },
        _sum: { quantity: true },
      }),
      this.prismaService.saleOrderLine.aggregate({
        where: { productId: id, saleOrder: { status: 'CONFIRMED' } },
        _sum: { quantity: true },
      }),
      this.prismaService.credit.aggregate({
        where: { productId: id, deletedAt: null },
        _sum: { quantity: true },
      }),
    ]);
    return {
      bought: round3(Number(bought._sum.quantity ?? 0)),
      sold: round3(
        Number(soldInPos._sum.quantity ?? 0) +
          Number(soldInSaleOrders._sum.quantity ?? 0) +
          Number(soldOnCredit._sum.quantity ?? 0),
      ),
      remaining: round3(Number(product.stockQty)),
    };
  }

  async listStockEntries(productId: string) {
    await this.getProductById(productId);
    return this.prismaService.posStockEntry.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async createStockEntry(productId: string, dto: CreatePosStockEntryDto, actorId?: string) {
    const product = await this.getProductById(productId);
    const [entry] = await this.prismaService.$transaction([
      this.prismaService.posStockEntry.create({
        data: {
          productId,
          quantity: dto.quantity,
          unitCost: dto.unitCost ?? 0,
          supplier: trimOrNull(dto.supplier),
          note: trimOrNull(dto.note),
          createdById: actorId || null,
        },
      }),
      this.prismaService.posProduct.update({
        where: { id: productId },
        data: { stockQty: { increment: dto.quantity } },
      }),
    ]);
    await this.log(
      POS_AUDIT.product,
      productId,
      'UPDATE',
      `Added ${dto.quantity} units to stock of ${product.name}`,
      actorId,
    );
    return entry;
  }
}
