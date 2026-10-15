import { PartialType } from '@nestjs/swagger';
import { CreateNewsletterDto } from './createNewsletter.dto';

export class UpdateNewsletterDto extends PartialType(CreateNewsletterDto) {}
