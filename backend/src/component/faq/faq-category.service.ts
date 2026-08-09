import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EStatus, FaqCategory } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFaqCategoryDto } from 'src/dto/faqCategory/createFaqCategory.dto';
import { UpdateFaqCategoryDto } from 'src/dto/faqCategory/updateFaqCategory.dto';

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

@Injectable()
export class FaqCategoryService {
    constructor(private readonly prisma: PrismaService) {}

    private async resolveUniqueSlug(name: string, slug?: string): Promise<string> {
        const base = slug?.trim() || slugify(name) || 'category';
        const existing = await this.prisma.faqCategory.findUnique({ where: { slug: base } });
        if (!existing) {
            return base;
        }
        return `${base}-${randomUUID().slice(0, 8)}`;
    }

    async create(dto: CreateFaqCategoryDto): Promise<FaqCategory> {
        const slug = await this.resolveUniqueSlug(dto.name, dto.slug);
        return this.prisma.faqCategory.create({
            data: {
                name: dto.name.trim(),
                slug,
                description: dto.description?.trim() || null,
                icon: dto.icon?.trim() || null,
                sortOrder: dto.sortOrder ?? 0,
                status: dto.status ?? EStatus.ACTIVE,
            },
        });
    }

    async update(id: string, dto: UpdateFaqCategoryDto): Promise<FaqCategory> {
        await this.getById(id);
        let slug: string | undefined;
        if (dto.slug !== undefined) {
            slug = await this.resolveUniqueSlug(dto.name ?? 'category', dto.slug);
        }
        return this.prisma.faqCategory.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name.trim() }),
                ...(slug !== undefined && { slug }),
                ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
                ...(dto.icon !== undefined && { icon: dto.icon?.trim() || null }),
                ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
                ...(dto.status !== undefined && { status: dto.status }),
            },
        });
    }

    async getById(id: string): Promise<FaqCategory> {
        const category = await this.prisma.faqCategory.findUnique({ where: { id } });
        if (!category) {
            throw new NotFoundException('FAQ category not found');
        }
        return category;
    }

    async listAdmin(): Promise<FaqCategory[]> {
        return this.prisma.faqCategory.findMany({
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
    }

    async listPublicWithFaqs() {
        return this.prisma.faqCategory.findMany({
            where: { status: EStatus.ACTIVE },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            include: {
                faqs: {
                    where: { status: EStatus.ACTIVE },
                    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
                    select: {
                        id: true,
                        question: true,
                        answer: true,
                        sortOrder: true,
                    },
                },
            },
        });
    }

    async delete(id: string): Promise<void> {
        await this.getById(id);
        await this.prisma.faqCategory.delete({ where: { id } });
    }
}
