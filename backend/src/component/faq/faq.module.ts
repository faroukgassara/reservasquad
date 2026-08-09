import { Module } from '@nestjs/common';
import { FaqService } from './faq.service';
import { FaqCategoryService } from './faq-category.service';
import { FaqBackofficeController } from './faq-backoffice.controller';
import { FaqCategoryBackofficeController } from './faq-category-backoffice.controller';
import { FaqFrontofficeController } from './faq-frontoffice.controller';

@Module({
    controllers: [FaqBackofficeController, FaqCategoryBackofficeController, FaqFrontofficeController],
    providers: [FaqService, FaqCategoryService],
    exports: [FaqService, FaqCategoryService],
})
export class FaqModule {}
