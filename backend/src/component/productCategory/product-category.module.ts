import { Module } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryBackofficeController } from './product-category-backoffice.controller';
import { ProductCategoryFrontofficeController } from './product-category-frontoffice.controller';

@Module({
    controllers: [
        ProductCategoryBackofficeController,
        ProductCategoryFrontofficeController,
    ],
    providers: [ProductCategoryService],
    exports: [ProductCategoryService],
})
export class ProductCategoryModule {}
