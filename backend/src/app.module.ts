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
import { RoomModule } from './component/room/room.module';
import { ReservationModule } from './component/reservation/reservation.module';
import { DirectoryModule } from './component/directory/directory.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [env],
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    RoomModule,
    ReservationModule,
    DirectoryModule,
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
export class AppModule {}
