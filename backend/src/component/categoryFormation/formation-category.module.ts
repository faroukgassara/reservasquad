import { Module } from '@nestjs/common';
import { FormationCategoryService } from './formation-category.service';
import { FormationCategoryBackofficeController } from './formation-category-backoffice.controller';
import { FormationCategoryFrontofficeController } from './formation-category-frontoffice.controller';

@Module({
    controllers: [
        FormationCategoryBackofficeController,
        FormationCategoryFrontofficeController,
    ],
    providers: [FormationCategoryService],
    exports: [FormationCategoryService],
})
export class FormationCategoryModule {}
