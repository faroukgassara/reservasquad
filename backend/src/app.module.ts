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
import { RoomModule } from './component/room/room.module';
import { ProfessorModule } from './component/professor/professor.module';
import { ReservationModule } from './component/reservation/reservation.module';
import { DailyIncomeModule } from './component/dailyIncome/daily-income.module';

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
    RoomModule,
    ProfessorModule,
    ReservationModule,
    DailyIncomeModule,
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
