import { PartialType } from '@nestjs/swagger';
import { CreateProfessorDto } from './createProfessor.dto';

export class UpdateProfessorDto extends PartialType(CreateProfessorDto) {}
