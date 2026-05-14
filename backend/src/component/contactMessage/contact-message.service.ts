import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactMessage, Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateContactMessageDto } from 'src/dto/contactMessage/createContactMessage.dto';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { buildAndFilters, composeWhere } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';

@Injectable()
export class ContactMessageService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateContactMessageDto): Promise<ContactMessage> {
        return this.prisma.contactMessage.create({
            data: {
                name: dto.name.trim(),
                email: dto.email.trim().toLowerCase(),
                message: dto.message.trim(),
            },
        });
    }

    async fetchMessages(
        pagination: PaginationData,
        orderBy: Record<string, any>[],
        searchWhere?: Prisma.ContactMessageWhereInput,
    ) {
        const andWhere = buildAndFilters(searchWhere);
        const where: Prisma.ContactMessageWhereInput = composeWhere({}, andWhere) as Prisma.ContactMessageWhereInput;

        const proxyModel = ProxyPrismaModel(this.prisma.contactMessage as any);
        return proxyModel.findManyPaginated({ where, orderBy }, pagination);
    }

    async getById(id: string): Promise<ContactMessage> {
        const row = await this.prisma.contactMessage.findUnique({ where: { id } });
        if (!row) {
            throw new NotFoundException('Contact message not found');
        }
        return row;
    }

    async delete(id: string): Promise<void> {
        await this.getById(id);
        await this.prisma.contactMessage.delete({ where: { id } });
    }
}
