import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { env } from './common/env/env';
import { AppService } from './app.service';
import { AuthModule } from './component/auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './common/guards/roles.guard';
import { UserModule } from './component/user/user.module';
import { ContactMessageModule } from './component/contactMessage/contact-message.module';
import { FaqModule } from './component/faq/faq.module';
import { TestimonialModule } from './component/testimonial/testimonial.module';
import { SalesModule } from './component/sales/sales.module';
import { ProductModule } from './component/product/product.module';
import { ProductCategoryModule } from './component/productCategory/product-category.module';
import { OrderModule } from './component/order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [env],
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    ContactMessageModule,
    FaqModule,
    TestimonialModule,
    SalesModule,
    ProductModule,
    ProductCategoryModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
