import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { ELang } from '../../enum/lang.enum';

class LangDto {
  @ApiProperty({ enum: ELang })
  @IsString()
  @IsEnum(ELang)
  lang: string;
}
export { LangDto };
