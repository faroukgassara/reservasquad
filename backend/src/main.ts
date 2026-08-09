import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ExceptionsFilter } from './common/filter/exception.filter';
import { LoggingInterceptor } from './common/interceptor/logging.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'node:path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as express from 'express';
import * as engines from 'consolidate';
import { getUploadRoot } from './common/upload/upload-paths';

const PORT = process.env.PORT || '4000';
const HOST = process.env.HOST || 'http://localhost';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  app.useBodyParser('json', { limit: '15mb' });
  app.useBodyParser('urlencoded', { limit: '15mb', extended: true });

  app.use('/assets', express.static(join(__dirname, '..', 'public/assets')));
  app.use(express.static(getUploadRoot()));

  app.engine('ejs', engines.ejs);
  app.set('views', join(__dirname, '..', 'view'));
  app.set('view engine', 'ejs');

  app.use('/asset', express.static('asset'));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new ExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Biblio Squad')
    .setDescription('Biblio Squad API documentation')
    .setVersion('1.0')
    .addTag('bibliosquad')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'Authorization',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: 1000,
      max: 1000,
      message: 'Too many requests, please slow down.',
    }),
  );

  await app.listen(PORT, () => {
    console.info(`✅ Swagger docs → ${HOST}:${PORT}/api`);
    console.info(`🚀 Server is running on ${HOST}:${PORT}`);
  });
}

bootstrap();
