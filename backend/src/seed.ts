import { NestFactory } from '@nestjs/core';
import { SeederController } from 'src/component/seeder/seeder.controller';
import { SeederModule } from 'src/component/seeder/seeder.module';

async function bootstrap() {
  NestFactory.createApplicationContext(SeederModule)
    .then(async (appContext) => {
      const seeder = appContext.get(SeederController);
      await seeder.seedAll();
      process.exit();
    })
    .catch((error) => {
      throw error;
    });
}
bootstrap();
