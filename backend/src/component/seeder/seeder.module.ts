import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { env } from 'src/common/env/env';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SeederController } from './seeder.controller';
import { SeederService } from './seeder.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [env],
      envFilePath: '.env',
    }),
    PrismaModule,
  ],
  controllers: [SeederController],
  providers: [SeederService, Logger],
})
export class SeederModule {}
