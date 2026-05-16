import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/generated/prisma/client';
import { CreateTeacherDto } from 'src/dto/directory/create-teacher.dto';
import { UpdateTeacherDto } from 'src/dto/directory/update-teacher.dto';
import { normalizeEmail } from 'src/common/utils/email.util';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  listForPublicBooking() {
    return this.prisma.user.findMany({
      where: { role: Role.TEACHER },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  listForAdmin() {
    return this.prisma.user.findMany({
      where: { role: Role.TEACHER },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { reservations: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateTeacherDto) {
    const email = normalizeEmail(dto.email);
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('This email is already used.');
    const phone = dto.phone?.trim() || null;
    return this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        phone,
        role: Role.TEACHER,
        password: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateTeacherDto) {
    const current = await this.prisma.user.findFirst({
      where: { id, role: Role.TEACHER },
    });
    if (!current) throw new NotFoundException('Teacher not found');

    let email: string | undefined;
    if (dto.email !== undefined) {
      email = normalizeEmail(dto.email);
      const taken = await this.prisma.user.findFirst({
        where: { email, id: { not: id } },
      });
      if (taken) throw new ConflictException('This email is already used.');
    }

    const phone =
      dto.phone === undefined ? undefined : dto.phone.trim() === '' ? null : dto.phone.trim();

    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name === undefined ? undefined : dto.name.trim(),
        email,
        phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    const current = await this.prisma.user.findFirst({
      where: { id, role: Role.TEACHER },
    });
    if (!current) throw new NotFoundException('Teacher not found');

    const bookings = await this.prisma.reservation.count({ where: { userId: id } });
    if (bookings > 0) {
      throw new ConflictException(
        'You cannot delete this teacher while reservations are linked to them.',
      );
    }

    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }
}
