import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { Environment } from '@common/enums/environment.enum';

import { createSwaggerConfig } from './swagger.config';

interface SwaggerSetupOptions {
  path?: string;
  enableBasicAuth?: boolean;
  persistAuthorization?: boolean;
}

const DEFAULT_OPTIONS: Required<SwaggerSetupOptions> = {
  path: 'api/docs',
  enableBasicAuth: true,
  persistAuthorization: true,
};

export function setupSwagger(app: INestApplication, options?: SwaggerSetupOptions): void {
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('app.nodeEnv');
  const logger = new Logger('SwaggerSetup');

  const config = { ...DEFAULT_OPTIONS, ...options };

  // Check if Swagger should be enabled
  if (nodeEnv === Environment.Production) {
    if (!configService.get<boolean>('swagger.enabledInProduction')) {
      logger.log(
        '✗ Swagger disabled in production (set SWAGGER_ENABLED_IN_PRODUCTION=true to enable)',
      );
      return;
    }
    logger.warn('⚠ Swagger is enabled in production - ensure it is properly protected');
  }

  // Setup basic authentication for non-development environments
  if (config.enableBasicAuth && nodeEnv !== Environment.Development) {
    const user = configService.get<string>('swagger.basicAuthUser');
    const password = configService.get<string>('swagger.basicAuthPassword');

    if (!user || !password) {
      logger.error(
        'Basic auth credentials missing - Swagger setup cancelled for security. ' +
          'Set SWAGGER_BASIC_AUTH_USER and SWAGGER_BASIC_AUTH_PASSWORD',
      );
      return;
    }

    app.use(`/${config.path}`, basicAuth({ users: { [user]: password }, challenge: true }));
    logger.log('✓ Basic authentication enabled for Swagger');
  }

  // Create and setup Swagger documentation
  try {
    const document = SwaggerModule.createDocument(app, createSwaggerConfig());
    SwaggerModule.setup(config.path, app, document, {
      swaggerOptions: {
        persistAuthorization: config.persistAuthorization,
        displayOperationId: false,
        filter: true,
        showRequestHeaders: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'patch', 'delete', 'options', 'trace'],
      },
      customCss: `
        .topbar { display: none; }
      `,
    });

    logger.log(`✓ Swagger UI available at: http://localhost:3000/${config.path}`);
  } catch (error) {
    logger.error('Failed to setup Swagger:', error instanceof Error ? error.message : error);
    throw error;
  }
}
