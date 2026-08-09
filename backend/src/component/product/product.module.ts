import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductBackofficeController } from './product-backoffice.controller';
import { ProductFrontofficeController } from './product-frontoffice.controller';
import { CommonServicesModule } from 'src/common/common-services/common-services.module';

@Module({
    imports: [CommonServicesModule],
    controllers: [ProductBackofficeController, ProductFrontofficeController],
    providers: [ProductService],
    exports: [ProductService],
})
export class ProductModule {}
