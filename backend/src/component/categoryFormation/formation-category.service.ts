import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFormationCategoryDto } from 'src/dto/formationCategory/createFormationCategory.dto';
import { UpdateFormationCategoryDto } from 'src/dto/formationCategory/updateFormationCategory.dto';
import { FormationCategory } from 'src/generated/prisma/client';

@Injectable()
export class FormationCategoryService {
    constructor(private readonly prismaService: PrismaService) {}

    async createCategory(dto: CreateFormationCategoryDto): Promise<FormationCategory> {
        return this.prismaService.formationCategory.create({
            data: {
                name: dto.name,
                specifications: dto.specifications ?? [],
                slug: dto.slug,
            },
        });
    }

    async updateCategory(id: string, dto: UpdateFormationCategoryDto): Promise<FormationCategory> {
        await this.getCategoryById(id);
        return this.prismaService.formationCategory.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.specifications !== undefined && { specifications: dto.specifications }),
                ...(dto.slug !== undefined && { slug: dto.slug }),
            },
        });
    }

    async getCategoryById(id: string): Promise<FormationCategory> {
        const category = await this.prismaService.formationCategory.findUnique({
            where: { id },
        });
        if (!category) {
            throw new NotFoundException('Formation category not found');
        }
        return category;
    }

    async listCategories(): Promise<FormationCategory[]> {
        return this.prismaService.formationCategory.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async deleteCategory(id: string): Promise<void> {
        await this.getCategoryById(id);
        await this.prismaService.formationCategory.delete({
            where: { id },
        });
    }
}
