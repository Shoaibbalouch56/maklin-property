import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const databaseUrl = process.env.DATABASE_URL || '';

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. Add it in Render Environment settings.',
    );
  }

  try {
    const host = new URL(databaseUrl).hostname;
    logger.log(`Using database host: ${host}`);
    const onRender = process.env.RENDER === 'true';
    if (onRender && (host === 'localhost' || host === '127.0.0.1')) {
      throw new Error(
        'DATABASE_URL uses localhost. On Render you must use Render Postgres Internal URL.',
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw error;
    }
    if (error instanceof Error && error.message.includes('localhost')) {
      throw error;
    }
    throw new Error('DATABASE_URL is invalid.');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret'],
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  const config = new DocumentBuilder()
    .setTitle('Maklin Admin API')
    .setDescription(
      'Public property read APIs + Admin Secret protected write APIs',
    )
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-admin-secret',
        in: 'header',
        description: 'Admin secret for protected property write operations',
      },
      'admin-secret',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Maklin Admin API running on 0.0.0.0:${port}`);
  logger.log('Swagger docs: /api');
}

bootstrap().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
