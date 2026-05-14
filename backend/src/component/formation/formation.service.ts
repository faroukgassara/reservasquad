import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFormationDto } from 'src/dto/formation/createFormation.dto';
import { UpdateFormationDto } from 'src/dto/formation/updateFormation.dto';
import { FetchFormationsDto } from 'src/dto/formation/fetchFormations.dto';
import { Formation, Prisma } from 'src/generated/prisma/client';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { buildAndFilters, composeWhere } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';
import { FileUploadService } from 'src/common/common-services/file-upload.service';
import { randomUUID } from 'node:crypto';

const FORMATION_IMAGES_TYPE = 'formations';

function isBase64DataUrl(value: string): boolean {
    return typeof value === 'string' && value.startsWith('data:image/') && value.includes(';base64,');
}

@Injectable()
export class FormationService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly fileUploadService: FileUploadService,
    ) {}

    // --- Formation CRUD ---

    async createFormation(dto: CreateFormationDto): Promise<Formation> {
        let imageUrl = dto.imageUrl;
        if (isBase64DataUrl(imageUrl)) {
            imageUrl = await this.fileUploadService.convertBase64(FORMATION_IMAGES_TYPE, imageUrl);
        }
        let slug = dto.slug;
        const existing = await this.prismaService.formation.findUnique({ where: { slug } });
        if (existing) {
            slug = `${slug}-${randomUUID().slice(0, 8)}`;
        }
        return this.prismaService.formation.create({
            data: {
                title: dto.title,
                description: dto.description,
                duration: dto.duration,
                price: dto.price,
                imageUrl,
                slug,
                status: dto.status,
                categoryId: dto.categoryId,
            },
        });
    }

    async updateFormation(id: string, dto: UpdateFormationDto): Promise<Formation> {
        await this.getFormationById(id);
        let imageUrl = dto.imageUrl;
        if (imageUrl !== undefined && isBase64DataUrl(imageUrl)) {
            imageUrl = await this.fileUploadService.convertBase64(FORMATION_IMAGES_TYPE, imageUrl);
        }
        return this.prismaService.formation.update({
            where: { id },
            data: {
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.duration !== undefined && { duration: dto.duration }),
                ...(dto.price !== undefined && { price: dto.price }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(dto.slug !== undefined && { slug: dto.slug }),
                ...(dto.status !== undefined && { status: dto.status }),
                ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
            },
        });
    }

    async getFormationById(id: string): Promise<Formation> {
        const formation = await this.prismaService.formation.findFirst({
            where: { id, deletedAt: null },
            include: { category: true },
        });
        if (!formation) {
            throw new NotFoundException('Formation not found');
        }
        return formation as Formation;
    }

    async getFormationBySlug(slug: string): Promise<Formation> {
        const formation = await this.prismaService.formation.findFirst({
            where: { slug, deletedAt: null },
            include: { category: true },
        });
        if (!formation) {
            throw new NotFoundException('Formation not found');
        }
        return formation as Formation;
    }

    async fetchFormations(
        query: FetchFormationsDto,
        pagination: PaginationData,
        orderBy: Record<string, any>[],
        searchWhere?: Prisma.FormationWhereInput,
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

        const durationFilter =
            query.durationMin != null || query.durationMax != null
                ? {
                      duration: {
                          ...(query.durationMin != null && { gte: query.durationMin }),
                          ...(query.durationMax != null && { lte: query.durationMax }),
                      },
                  }
                : undefined;

        const andWhere = buildAndFilters<Prisma.FormationWhereInput>(
            query.status ? { status: query.status } : undefined,
            query.categoryId ? { categoryId: query.categoryId } : undefined,
            priceFilter,
            durationFilter,
            searchWhere,
        );

        const where: Prisma.FormationWhereInput = composeWhere(
            { deletedAt: null },
            andWhere,
        ) as Prisma.FormationWhereInput;

        const proxyModel = ProxyPrismaModel(this.prismaService.formation as any);
        return proxyModel.findManyPaginated(
            {
                where,
                orderBy,
                include: { category: true },
            },
            pagination,
        );
    }

    async deleteFormation(id: string): Promise<void> {
        await this.getFormationById(id);
        await this.prismaService.formation.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async archiveFormation(id: string): Promise<Formation> {
        await this.getFormationById(id);
        return this.prismaService.formation.update({
            where: { id },
            data: { status: 'INACTIVE' as const },
            include: { category: true },
        });
    }

    async unarchiveFormation(id: string): Promise<Formation> {
        await this.getFormationById(id);
        return this.prismaService.formation.update({
            where: { id },
            data: { status: 'ACTIVE' as const },
            include: { category: true },
        });
    }
}
