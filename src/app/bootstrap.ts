import { INestApplication, RequestMethod, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { createWinstonConfig } from '@/infrastructure/logger/logger.config';
import { setupSwagger } from '@/infrastructure/swagger/setup-swagger';

import { AppModule } from './app.module';
import { setupGracefulShutdown } from './lifecycle/graceful-shutdown.service';

export async function bootstrap(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(createWinstonConfig()),
  });

  const configService = app.get(ConfigService);
  const isProduction = configService.get<string>('app.nodeEnv') === 'production';
  const allowedOrigins = configService.get<string>('app.allowedOrigins');

  app.enableCors({
    origin: isProduction && allowedOrigins ? allowedOrigins.split(',').map((o) => o.trim()) : true,
    credentials: true,
  });

  app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));
  app.use(compression());
  app.use(cookieParser());

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  setupSwagger(app);
  setupGracefulShutdown(app);

  return app;
}
