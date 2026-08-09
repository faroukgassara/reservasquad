import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProfessorDto } from 'src/dto/professor/createProfessor.dto';
import { UpdateProfessorDto } from 'src/dto/professor/updateProfessor.dto';
import { FetchProfessorsDto } from 'src/dto/professor/fetchProfessors.dto';
import { Prisma, Professor } from 'src/generated/prisma/client';
import { ProxyPrismaModel } from 'src/common/pagination/proxy';
import { buildAndFilters, composeWhere } from 'src/common/pagination/prisma-query.builder';
import { PaginationData } from 'src/common/pagination/types';
import { normalizeEmail } from 'src/common/utils/email.util';

@Injectable()
export class ProfessorService {
  constructor(private readonly prismaService: PrismaService) {}

  async createProfessor(dto: CreateProfessorDto): Promise<Professor> {
    const email = dto.email ? normalizeEmail(dto.email) : null;
    if (email) {
      const existing = await this.prismaService.professor.findFirst({
        where: { email, deletedAt: null },
      });
      if (existing) {
        throw new ConflictException('A professor with this email already exists');
      }
    }

    return this.prismaService.professor.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email,
        phone: dto.phone?.replaceAll(/\s+/g, '') || null,
        specialty: dto.specialty?.trim() || null,
      },
    });
  }

  async updateProfessor(id: string, dto: UpdateProfessorDto): Promise<Professor> {
    await this.getProfessorById(id);
    if (dto.email) {
      const email = normalizeEmail(dto.email);
      const existing = await this.prismaService.professor.findFirst({
        where: { email, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('A professor with this email already exists');
      }
    }

    const data: Prisma.ProfessorUpdateInput = {
      ...(dto.firstName !== undefined && { firstName: dto.firstName.trim() }),
      ...(dto.lastName !== undefined && { lastName: dto.lastName.trim() }),
      ...(dto.email !== undefined && {
        email: dto.email ? normalizeEmail(dto.email) : null,
      }),
      ...(dto.phone !== undefined && {
        phone: dto.phone?.replaceAll(/\s+/g, '') || null,
      }),
      ...(dto.specialty !== undefined && {
        specialty: dto.specialty?.trim() || null,
      }),
    };

    return this.prismaService.professor.update({ where: { id }, data });
  }

  async getProfessorById(id: string): Promise<Professor> {
    const professor = await this.prismaService.professor.findFirst({
      where: { id, deletedAt: null },
    });
    if (!professor) throw new NotFoundException('Professor not found');
    return professor;
  }

  async listProfessors(
    _query: FetchProfessorsDto,
    pagination: PaginationData,
    orderBy: Record<string, unknown>[],
    search?: Prisma.ProfessorWhereInput,
  ) {
    const andWhere = buildAndFilters(search);
    const proxied = ProxyPrismaModel(this.prismaService.professor as any);
    return proxied.findManyPaginated(
      {
        where: composeWhere({ deletedAt: null }, andWhere),
        orderBy,
      },
      pagination,
    );
  }

  async softDeleteProfessor(id: string): Promise<Professor> {
    await this.getProfessorById(id);
    return this.prismaService.professor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async countActive(): Promise<number> {
    return this.prismaService.professor.count({
      where: { deletedAt: null },
    });
  }
}
