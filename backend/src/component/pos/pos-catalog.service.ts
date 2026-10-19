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
import { formatAuditMoney } from 'src/common/utils/audit-format.util';

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
        showOnMenu: dto.showOnMenu ?? true,
        imageUrl: await this.resolveImage(CATEGORY_IMAGES_TYPE, dto.imageUrl),
      },
    });
    await this.log(POS_AUDIT.category, category.id, 'CREATE', `Catégorie caisse "${category.name}" créée`, actorId);
    return category;
  }

  async updateCategory(id: string, dto: UpdatePosCategoryDto, actorId?: string) {
    await this.getCategoryById(id);
    const data: Prisma.PosCategoryUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.showOnMenu !== undefined && { showOnMenu: dto.showOnMenu }),
    };
    if (dto.imageUrl !== undefined) {
      data.imageUrl = await this.resolveImage(CATEGORY_IMAGES_TYPE, dto.imageUrl);
    }
    const category = await this.prismaService.posCategory.update({ where: { id }, data });
    await this.log(POS_AUDIT.category, category.id, 'UPDATE', `Catégorie caisse "${category.name}" modifiée`, actorId);
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
    await this.log(POS_AUDIT.category, category.id, 'DELETE', `Catégorie caisse "${category.name}" supprimée`, actorId);
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
      ...(query.stockableOnly && { type: 'STOCKABLE' }),
      ...(query.subscription && { subscriptionDuration: { not: null }, subscriptionUnit: { not: null } }),
      ...(query.lowStockOnly && {
        type: 'STOCKABLE',
        availableInPos: true,
        stockQty: { gt: 0 },
      }),
      ...(query.outOfStockOnly && {
        type: 'STOCKABLE',
        stockQty: { lte: 0 },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
          { reference: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    if (query.lowStockOnly) {
      const allMatching = await this.prismaService.posProduct.findMany({
        where,
        include: { category: { select: categorySelect } },
        orderBy: orderBy?.length ? orderBy : [{ name: 'asc' }],
      });
      const filtered = allMatching.filter((p) => {
        const min = p.minStock !== null && p.minStock !== undefined ? Number(p.minStock) : 10;
        const stock = Number(p.stockQty);
        return stock > 0 && stock <= min;
      });
      const total = filtered.length;
      const page = pagination.page ?? 1;
      const perPage = pagination.perPage ?? 10;
      const start = (page - 1) * perPage;
      const paginatedData = filtered.slice(start, start + perPage);
      return {
        data: paginatedData,
        meta: {
          total,
          lastPage: Math.ceil(total / perPage) || 1,
          currentPage: page,
          perPage,
          prev: page > 1 ? page - 1 : null,
          next: start + perPage < total ? page + 1 : null,
        },
      };
    }

    const proxied = ProxyPrismaModel(this.prismaService.posProduct as any);
    return proxied.findManyPaginated(
      { where, orderBy, include: { category: { select: categorySelect } } },
      pagination,
    );
  }

  async getLowStockProducts(limit = 10) {
    const products = await this.prismaService.posProduct.findMany({
      where: {
        deletedAt: null,
        type: 'STOCKABLE',
        availableInPos: true,
        stockQty: { gt: 0 },
      },
      include: { category: { select: categorySelect } },
      orderBy: { name: 'asc' },
    });

    const lowStock = products
      .filter((p) => {
        const min = p.minStock !== null && p.minStock !== undefined ? Number(p.minStock) : 10;
        const stock = Number(p.stockQty);
        return stock > 0 && stock <= min;
      })
      .sort((a, b) => {
        const minA = a.minStock !== null && a.minStock !== undefined ? Number(a.minStock) : 10;
        const minB = b.minStock !== null && b.minStock !== undefined ? Number(b.minStock) : 10;
        const diffA = Number(a.stockQty) - minA;
        const diffB = Number(b.stockQty) - minB;
        if (diffA !== diffB) return diffA - diffB;
        return Number(a.stockQty) - Number(b.stockQty);
      });

    return {
      total: lowStock.length,
      items: limit > 0 ? lowStock.slice(0, limit) : lowStock,
    };
  }

  async listAvailableProducts() {
    return this.prismaService.posProduct.findMany({
      where: { deletedAt: null, availableInPos: true, subscriptionDuration: null },
      orderBy: { name: 'asc' },
      include: { category: { select: categorySelect } },
    });
  }

  /**
   * Public café menu: sellable, in-stock products grouped by category, without any internal data (cost, stock…).
   * Categories switched off with `showOnMenu` (e.g. the library) are left out entirely.
   */
  async getPublicMenu() {
    const [categories, products] = await Promise.all([
      this.prismaService.posCategory.findMany({
        where: { deletedAt: null, showOnMenu: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, imageUrl: true },
      }),
      this.prismaService.posProduct.findMany({
        where: {
          deletedAt: null,
          availableInPos: true,
          subscriptionDuration: null,
          // Hidden categories stay off the menu; products without a category are listed under "Other".
          OR: [
            { categoryId: null },
            { category: { is: { deletedAt: null, showOnMenu: true } } },
            { category: { is: { deletedAt: { not: null } } } },
          ],
          // Out-of-stock items are not offered to customers.
          NOT: { type: 'STOCKABLE', stockQty: { lte: 0 } },
        },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, price: true, imageUrl: true, categoryId: true },
      }),
    ]);

    const toMenuItem = (product: (typeof products)[number]) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.imageUrl,
    });

    const sections = categories
      .map((category) => ({
        ...category,
        products: products.filter((product) => product.categoryId === category.id).map(toMenuItem),
      }))
      .filter((section) => section.products.length > 0);

    const knownCategoryIds = new Set(categories.map((category) => category.id));
    const uncategorized = products
      .filter((product) => !product.categoryId || !knownCategoryIds.has(product.categoryId))
      .map(toMenuItem);
    if (uncategorized.length > 0) {
      sections.push({ id: 'other', name: null, imageUrl: null, products: uncategorized });
    }

    return { categories: sections, updatedAt: new Date().toISOString() };
  }

  async listAllProductsForInventory(query?: FetchPosProductsDto) {
    const search = query?.search?.trim();
    const where: Prisma.PosProductWhereInput = {
      deletedAt: null,
      ...(query?.categoryId && { categoryId: query.categoryId }),
      ...(query?.availableInPos !== undefined && { availableInPos: query.availableInPos }),
      ...(query?.stockableOnly && { type: 'STOCKABLE' }),
      ...(query?.subscription && { subscriptionDuration: { not: null }, subscriptionUnit: { not: null } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
          { reference: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    return this.prismaService.posProduct.findMany({
      where,
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
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
        ...(dto.minStock !== undefined && {
          minStock: dto.minStock !== null ? dto.minStock : null,
        }),
        barcode: trimOrNull(dto.barcode),
        reference: trimOrNull(dto.reference),
        imageUrl: await this.resolveImage(PRODUCT_IMAGES_TYPE, dto.imageUrl),
        taxRate: dto.taxRate ?? 0,
        ...period,
      },
    });
    await this.log(POS_AUDIT.product, product.id, 'CREATE', `Produit caisse "${product.name}" créé · Prix : ${formatAuditMoney(product.price)}`, actorId);
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
      ...(dto.minStock !== undefined && {
        minStock: dto.minStock !== null ? dto.minStock : null,
      }),
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
    await this.log(POS_AUDIT.product, product.id, 'UPDATE', `Produit caisse "${product.name}" modifié · Prix : ${formatAuditMoney(product.price)}`, actorId);
    return product;
  }

  async deleteProduct(id: string, actorId?: string) {
    await this.getProductById(id);
    const product = await this.prismaService.posProduct.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.log(POS_AUDIT.product, product.id, 'DELETE', `Produit caisse "${product.name}" supprimé`, actorId);
    return product;
  }

  async getDeletedProductById(id: string) {
    const product = await this.prismaService.posProduct.findFirst({
      where: { id, deletedAt: { not: null } },
      include: { category: { select: categorySelect } },
    });
    if (!product) throw new NotFoundException('Deleted product not found');
    return product;
  }

  async listDeletedProducts(
    pagination: PaginationData,
    orderBy: Record<string, unknown>[],
    query?: FetchPosProductsDto,
  ) {
    const search = query?.search?.trim();
    const where: Prisma.PosProductWhereInput = {
      deletedAt: { not: null },
      ...(query?.categoryId && { categoryId: query.categoryId }),
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
      {
        where,
        include: { category: { select: categorySelect } },
        orderBy: orderBy?.length ? orderBy : [{ deletedAt: 'desc' }],
      },
      pagination,
    );
  }

  async restoreProduct(id: string, actorId?: string) {
    const existing = await this.getDeletedProductById(id);
    const restored = await this.prismaService.posProduct.update({
      where: { id },
      data: { deletedAt: null },
      include: { category: { select: categorySelect } },
    });
    await this.log(
      POS_AUDIT.product,
      restored.id,
      'UPDATE',
      `Produit caisse "${restored.name}" restauré`,
      actorId,
    );
    return restored;
  }

  async hardDeleteProduct(id: string, actorId?: string) {
    const existing = await this.getDeletedProductById(id);
    const removed = await this.prismaService.posProduct.delete({
      where: { id },
    });
    await this.log(
      POS_AUDIT.product,
      id,
      'DELETE',
      `Produit caisse "${existing.name}" supprimé définitivement`,
      actorId,
    );
    return removed;
  }

  async getProductStats(id: string) {
    const product = await this.getProductById(id);
    const stock = round3(Number(product.stockQty));

    const [stockEntriesSum, posLines, creditSales, saleOrderSales] = await Promise.all([
      this.prismaService.posStockEntry.aggregate({
        where: { productId: id },
        _sum: { quantity: true },
      }),
      this.prismaService.posOrderLine.findMany({
        where: { productId: id },
        select: {
          quantity: true,
          orderId: true,
          order: { select: { id: true, status: true } },
        },
      }),
      this.prismaService.credit.findMany({
        where: { productId: id, deletedAt: null },
        select: { id: true, quantity: true },
      }),
      this.prismaService.saleOrderLine.findMany({
        where: { productId: id, saleOrder: { status: 'CONFIRMED' } },
        select: { id: true, quantity: true, saleOrderId: true },
      }),
    ]);

    const bought = round3(Number(stockEntriesSum._sum.quantity ?? 0));

    let posSoldQty = 0;
    const paidOrderIds = new Set<string>();
    for (const line of posLines) {
      posSoldQty += Number(line.quantity) || 0;
      if (line.order?.status === 'PAID') {
        paidOrderIds.add(line.orderId);
      }
    }

    let creditSoldQty = 0;
    for (const credit of creditSales) {
      creditSoldQty += Number(credit.quantity) || 0;
    }

    let saleOrderSoldQty = 0;
    const saleOrderIds = new Set<string>();
    for (const line of saleOrderSales) {
      saleOrderSoldQty += Number(line.quantity) || 0;
      if (line.saleOrderId) {
        saleOrderIds.add(line.saleOrderId);
      }
    }

    const sold = Math.max(0, round3(posSoldQty + creditSoldQty + saleOrderSoldQty));
    const soldOrdersCount = paidOrderIds.size + creditSales.length + saleOrderIds.size;

    return {
      bought,
      sold,
      soldOrdersCount,
      remaining: stock,
      stock,
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
      `Ajout de ${dto.quantity} unité(s) au stock de "${product.name}"`,
      actorId,
    );
    return entry;
  }
}
