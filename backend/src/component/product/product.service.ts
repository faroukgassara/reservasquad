import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from 'src/dto/product/createProduct.dto';
import { UpdateProductDto } from 'src/dto/product/updateProduct.dto';
import { FetchProductsDto } from 'src/dto/product/fetchProducts.dto';
import { Product, Prisma } from 'src/generated/prisma/client';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { buildAndFilters, composeWhere } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';
import { FileUploadService } from 'src/common/common-services/file-upload.service';
import { randomUUID } from 'node:crypto';

const PRODUCT_IMAGES_TYPE = 'products';

function isBase64DataUrl(value: string): boolean {
    return (
        typeof value === 'string' &&
        value.startsWith('data:image/') &&
        value.includes(';base64,')
    );
}

function cleanStringList(values?: string[]): string[] {
    if (!values?.length) return [];
    return values.map((v) => v.trim()).filter(Boolean);
}

@Injectable()
export class ProductService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly fileUploadService: FileUploadService,
    ) {}

    private async resolveImage(value: string): Promise<string> {
        if (isBase64DataUrl(value)) {
            return this.fileUploadService.convertBase64(PRODUCT_IMAGES_TYPE, value);
        }
        return value;
    }

    private async resolveImages(images?: string[], imageUrl?: string): Promise<{
        images: string[];
        imageUrl: string | null;
    }> {
        const source =
            images && images.length > 0
                ? images
                : imageUrl
                  ? [imageUrl]
                  : [];

        const resolved: string[] = [];
        for (const item of source) {
            const trimmed = item?.trim();
            if (!trimmed) continue;
            resolved.push(await this.resolveImage(trimmed));
        }

        return {
            images: resolved,
            imageUrl: resolved[0] ?? null,
        };
    }

    async createProduct(dto: CreateProductDto): Promise<Product> {
        const { images, imageUrl } = await this.resolveImages(dto.images, dto.imageUrl);

        let slug = dto.slug;
        const existing = await this.prismaService.product.findUnique({
            where: { slug },
        });
        if (existing) {
            slug = `${slug}-${randomUUID().slice(0, 8)}`;
        }

        return this.prismaService.product.create({
            data: {
                title: dto.title,
                description: dto.description,
                price: dto.price,
                discountedPrice: dto.discountedPrice,
                imageUrl,
                images,
                slug,
                badges: cleanStringList(dto.badges),
                materials: cleanStringList(dto.materials),
                sizes: cleanStringList(dto.sizes),
                hasEngraving: dto.hasEngraving ?? false,
                featured: dto.featured ?? false,
                status: dto.status,
                categoryId: dto.categoryId,
            },
        });
    }

    async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
        await this.getProductById(id);

        const data: Prisma.ProductUpdateInput = {
            ...(dto.title !== undefined && { title: dto.title }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.price !== undefined && { price: dto.price }),
            ...(dto.discountedPrice !== undefined && {
                discountedPrice: dto.discountedPrice,
            }),
            ...(dto.slug !== undefined && { slug: dto.slug }),
            ...(dto.badges !== undefined && { badges: cleanStringList(dto.badges) }),
            ...(dto.materials !== undefined && {
                materials: cleanStringList(dto.materials),
            }),
            ...(dto.sizes !== undefined && { sizes: cleanStringList(dto.sizes) }),
            ...(dto.hasEngraving !== undefined && { hasEngraving: dto.hasEngraving }),
            ...(dto.featured !== undefined && { featured: dto.featured }),
            ...(dto.status !== undefined && { status: dto.status }),
            ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        };

        if (dto.images !== undefined || dto.imageUrl !== undefined) {
            const resolved = await this.resolveImages(
                dto.images,
                dto.imageUrl ?? undefined,
            );
            data.images = resolved.images;
            data.imageUrl = resolved.imageUrl;
        }

        return this.prismaService.product.update({
            where: { id },
            data,
        });
    }

    async getProductById(id: string): Promise<Product> {
        const product = await this.prismaService.product.findFirst({
            where: { id, deletedAt: null },
            include: { category: true },
        });
        if (!product) {
            throw new NotFoundException('Product not found');
        }
        return product as Product;
    }

    async getProductBySlug(slug: string): Promise<Product> {
        const product = await this.prismaService.product.findFirst({
            where: { slug, deletedAt: null },
            include: { category: true },
        });
        if (!product) {
            throw new NotFoundException('Product not found');
        }
        return product as Product;
    }

    async fetchProducts(
        query: FetchProductsDto,
        pagination: PaginationData,
        orderBy: Record<string, any>[],
        searchWhere?: Prisma.ProductWhereInput,
    ) {
        const priceFilter =
            query.priceMin != null || query.priceMax != null
                ? {
                      price: {
                          ...(query.priceMin != null && { gte: query.priceMin }),
                          ...(query.priceMax != null && { lte: query.priceMax }),
                      },
                  }
                : undefined;

        const categoryIds = [
            ...(query.categoryIds ?? []),
            ...(query.categoryId ? [query.categoryId] : []),
        ];
        const uniqueCategoryIds = [...new Set(categoryIds.filter(Boolean))];

        const featuredFilter =
            query.featured === true || query.featured === false
                ? { featured: query.featured }
                : undefined;

        const andWhere = buildAndFilters<Prisma.ProductWhereInput>(
            query.status ? { status: query.status } : undefined,
            uniqueCategoryIds.length
                ? { categoryId: { in: uniqueCategoryIds } }
                : undefined,
            featuredFilter,
            priceFilter,
            searchWhere,
        );

        const where: Prisma.ProductWhereInput = composeWhere(
            { deletedAt: null },
            andWhere,
        ) as Prisma.ProductWhereInput;

        const proxyModel = ProxyPrismaModel(this.prismaService.product as any);
        return proxyModel.findManyPaginated(
            {
                where,
                orderBy,
                include: { category: true },
            },
            pagination,
        );
    }

    async deleteProduct(id: string): Promise<void> {
        await this.getProductById(id);
        await this.prismaService.product.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
