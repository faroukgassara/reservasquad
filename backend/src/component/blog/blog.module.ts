import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogBackofficeController } from './blog-backoffice.controller';
import { BlogFrontofficeController } from './blog-frontoffice.controller';

@Module({
    controllers: [BlogBackofficeController, BlogFrontofficeController],
    providers: [BlogService],
    exports: [BlogService],
})
export class BlogModule {}
