import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '@app/app.module';
import { WinstonModule } from 'nest-winston/dist/winston.module';
import { createWinstonConfig } from '@infrastructure/logger/logger.config';
import { setupSwagger } from '@infrastructure/swagger/setup-swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(createWinstonConfig()),
  });

  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Server is running on http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
