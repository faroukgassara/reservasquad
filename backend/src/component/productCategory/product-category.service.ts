import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductCategoryDto } from 'src/dto/productCategory/createProductCategory.dto';
import { UpdateProductCategoryDto } from 'src/dto/productCategory/updateProductCategory.dto';
import { EStatus, ProductCategory } from 'src/generated/prisma/client';

@Injectable()
export class ProductCategoryService {
    constructor(private readonly prismaService: PrismaService) {}

    async createCategory(dto: CreateProductCategoryDto): Promise<ProductCategory> {
        return this.prismaService.productCategory.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                sortOrder: dto.sortOrder ?? 0,
                status: dto.status ?? EStatus.ACTIVE,
            },
        });
    }

    async updateCategory(
        id: string,
        dto: UpdateProductCategoryDto,
    ): Promise<ProductCategory> {
        await this.getCategoryById(id);
        return this.prismaService.productCategory.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.slug !== undefined && { slug: dto.slug }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
                ...(dto.status !== undefined && { status: dto.status }),
            },
        });
    }

    async getCategoryById(id: string): Promise<ProductCategory> {
        const category = await this.prismaService.productCategory.findUnique({
            where: { id },
        });
        if (!category) {
            throw new NotFoundException('Product category not found');
        }
        return category;
    }

    async listCategories(): Promise<ProductCategory[]> {
        return this.prismaService.productCategory.findMany({
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
    }

    async listActiveCategories(): Promise<ProductCategory[]> {
        return this.prismaService.productCategory.findMany({
            where: { status: EStatus.ACTIVE },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
    }

    async deleteCategory(id: string): Promise<void> {
        await this.getCategoryById(id);
        const productsCount = await this.prismaService.product.count({
            where: { categoryId: id, deletedAt: null },
        });
        if (productsCount > 0) {
            throw new BadRequestException(
                'Cannot delete category with attached products',
            );
        }
        await this.prismaService.productCategory.delete({
            where: { id },
        });
    }
}
