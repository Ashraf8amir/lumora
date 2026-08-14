import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { default as configuration } from './configuration';
import { envValidationSchema } from './env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
  ],
})
export class ConfigurationModule {}
