import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { Roles } from 'src/common/decorator/roles.decorator';
import { CreateTeacherDto } from 'src/dto/directory/create-teacher.dto';
import { UpdateTeacherDto } from 'src/dto/directory/update-teacher.dto';

@ApiTags('directory')
@ApiBearerAuth('Authorization')
@Controller('directory')
export class TeachersAdminController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get('teachers')
  @Roles({ roles: ['ADMIN'] })
  @ApiOperation({ summary: 'List teachers (full details, admin)' })
  listTeachers() {
    return this.teachersService.listForAdmin();
  }

  @Post('teachers')
  @Roles({ roles: ['ADMIN'] })
  @ApiOperation({
    summary: 'Create teacher profile',
    description: 'No password — teachers are selected on the public booking form only.',
  })
  createTeacher(@Body() dto: CreateTeacherDto) {
    return this.teachersService.create(dto);
  }

  @Patch('teachers/:id')
  @Roles({ roles: ['ADMIN'] })
  updateTeacher(@Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    return this.teachersService.update(id, dto);
  }

  @Delete('teachers/:id')
  @Roles({ roles: ['ADMIN'] })
  removeTeacher(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }
}
