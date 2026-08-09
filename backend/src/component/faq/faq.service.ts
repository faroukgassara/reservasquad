import { Injectable, NotFoundException } from '@nestjs/common';
import { Faq, EStatus } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFaqDto } from 'src/dto/faq/createFaq.dto';
import { UpdateFaqDto } from 'src/dto/faq/updateFaq.dto';

@Injectable()
export class FaqService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateFaqDto): Promise<Faq> {
        await this.ensureCategoryExists(dto.categoryId);
        return this.prisma.faq.create({
            data: {
                question: dto.question.trim(),
                answer: dto.answer.trim(),
                categoryId: dto.categoryId,
                sortOrder: dto.sortOrder ?? 0,
                status: dto.status ?? EStatus.ACTIVE,
            },
            include: { category: true },
        });
    }

    async update(id: string, dto: UpdateFaqDto): Promise<Faq> {
        await this.getById(id);
        if (dto.categoryId) {
            await this.ensureCategoryExists(dto.categoryId);
        }
        return this.prisma.faq.update({
            where: { id },
            data: {
                ...(dto.question !== undefined && { question: dto.question.trim() }),
                ...(dto.answer !== undefined && { answer: dto.answer.trim() }),
                ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
                ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
                ...(dto.status !== undefined && { status: dto.status }),
            },
            include: { category: true },
        });
    }

    private async ensureCategoryExists(categoryId: string): Promise<void> {
        const category = await this.prisma.faqCategory.findUnique({ where: { id: categoryId } });
        if (!category) {
            throw new NotFoundException('FAQ category not found');
        }
    }

    async getById(id: string): Promise<Faq> {
        const faq = await this.prisma.faq.findUnique({ where: { id } });
        if (!faq) {
            throw new NotFoundException('FAQ not found');
        }
        return faq;
    }

    async listAdmin(): Promise<Faq[]> {
        return this.prisma.faq.findMany({
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
            include: { category: true },
        });
    }

    async listPublic(take?: number, categoryId?: string): Promise<Faq[]> {
        return this.prisma.faq.findMany({
            where: {
                status: EStatus.ACTIVE,
                ...(categoryId ? { categoryId } : {}),
            },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
            ...(take ? { take } : {}),
        });
    }

    async delete(id: string): Promise<void> {
        await this.getById(id);
        await this.prisma.faq.delete({ where: { id } });
    }
}
