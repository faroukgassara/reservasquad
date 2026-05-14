import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class SendMailDto {
  @IsNotEmpty()
  @IsString({ each: true })
  to: string | string[];

  @IsNotEmpty()
  @IsString()
  from: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  template: string;

  @IsOptional()
  attachments?: {
    filename: string;
    content: Buffer;
    contentType?: string;
  }[];
}
