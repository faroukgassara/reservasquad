import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'src/prisma/prisma.service';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/generated/prisma/client';

@ApiTags('directory')
@ApiBearerAuth('Authorization')
@Controller('directory')
export class DirectoryController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('teachers')
  @Roles({ roles: ['ADMIN'] })
  @ApiOperation({ summary: 'List teachers (admin bookings)' })
  listTeachers() {
    return this.prisma.user.findMany({
      where: { role: Role.TEACHER },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
  }
}
