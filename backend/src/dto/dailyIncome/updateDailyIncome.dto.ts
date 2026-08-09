import { PartialType } from '@nestjs/swagger';
import { CreateDailyIncomeDto } from './createDailyIncome.dto';

export class UpdateDailyIncomeDto extends PartialType(CreateDailyIncomeDto) {}
