import { Injectable, NotFoundException } from '@nestjs/common';
import { ETestimonialStatus, Prisma, Testimonial } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTestimonialDto } from 'src/dto/testimonial/createTestimonial.dto';
import { UpdateTestimonialStatusDto } from 'src/dto/testimonial/updateTestimonialStatus.dto';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { buildAndFilters, composeWhere } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';

export type TestimonialConfirmation = {
    id: string;
    createdAt: Date;
};

@Injectable()
export class TestimonialService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateTestimonialDto): Promise<TestimonialConfirmation> {
        return this.prisma.testimonial.create({
            data: {
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                email: dto.email.trim().toLowerCase(),
                title: dto.title.trim(),
                description: dto.description.trim(),
                rating: dto.rating,
                status: ETestimonialStatus.PENDING,
            },
            select: { id: true, createdAt: true },
        });
    }

    async listPublic(take = 12): Promise<Testimonial[]> {
        return this.prisma.testimonial.findMany({
            where: { status: ETestimonialStatus.APPROVED },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
            take: Math.min(50, Math.max(1, take)),
        });
    }

    async fetchTestimonials(
        pagination: PaginationData,
        orderBy: Record<string, unknown>[],
        filters?: { status?: ETestimonialStatus },
        searchWhere?: Prisma.TestimonialWhereInput,
    ) {
        const filterWhere: Prisma.TestimonialWhereInput = {};
        if (filters?.status) {
            filterWhere.status = filters.status;
        }

        const andWhere = buildAndFilters(searchWhere, filterWhere);
        const where = composeWhere({}, andWhere) as Prisma.TestimonialWhereInput;

        const proxyModel = ProxyPrismaModel(this.prisma.testimonial as any);
        return proxyModel.findManyPaginated({ where, orderBy }, pagination);
    }

    async updateStatus(id: string, dto: UpdateTestimonialStatusDto): Promise<Testimonial> {
        const existing = await this.prisma.testimonial.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Testimonial not found');
        }

        return this.prisma.testimonial.update({
            where: { id },
            data: { status: dto.status },
        });
    }

    async delete(id: string): Promise<void> {
        const existing = await this.prisma.testimonial.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Testimonial not found');
        }
        await this.prisma.testimonial.delete({ where: { id } });
    }
}
