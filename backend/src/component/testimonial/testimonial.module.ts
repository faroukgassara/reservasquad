import { Module } from '@nestjs/common';
import { TestimonialService } from './testimonial.service';
import { TestimonialFrontofficeController } from './testimonial-frontoffice.controller';
import { TestimonialBackofficeController } from './testimonial-backoffice.controller';

@Module({
    controllers: [TestimonialFrontofficeController, TestimonialBackofficeController],
    providers: [TestimonialService],
    exports: [TestimonialService],
})
export class TestimonialModule {}
