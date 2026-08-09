import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SalesModule } from 'src/component/sales/sales.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { IEnv } from 'src/common/env/env';
import { OrderFrontofficeController } from './order-frontoffice.controller';
import { OrderBackofficeController } from './order-backoffice.controller';
import { OrderService } from './order.service';

@Module({
  imports: [
    PrismaModule,
    SalesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const env = configService.get<IEnv>('env');
        return {
          secret: env?.JWT_SECRET,
        };
      },
    }),
  ],
  controllers: [OrderFrontofficeController, OrderBackofficeController],
  providers: [OrderService],
})
export class OrderModule {}
