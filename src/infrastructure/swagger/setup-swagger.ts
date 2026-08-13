import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { Environment } from '@common/enums/environment.enum';

import { createSwaggerConfig } from './swagger.config';

const SWAGGER_PATH = 'api/docs';

export function setupSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('app.nodeEnv');
  const logger = new Logger('Swagger');

  if (
    nodeEnv === Environment.Production &&
    !configService.get<boolean>('swagger.enabledInProduction')
  ) {
    logger.log('Swagger is disabled in production (SWAGGER_ENABLED_IN_PRODUCTION=false)');
    return;
  }

  if (nodeEnv !== Environment.Development) {
    const user = configService.get<string>('swagger.basicAuthUser');
    const password = configService.get<string>('swagger.basicAuthPassword');

    if (!user || !password) {
      logger.warn('Swagger basic-auth credentials are missing, skipping Swagger setup for safety');
      return;
    }

    app.use(`/${SWAGGER_PATH}`, basicAuth({ users: { [user]: password }, challenge: true }));
  }

  const document = SwaggerModule.createDocument(app, createSwaggerConfig());
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  logger.log(`Swagger docs available at /${SWAGGER_PATH}`);
}
