import { ConfigModule } from '@nestjs/config';
import { default as configuration } from './configuration';
import { envValidationSchema } from './env.validation';

export const ConfigurationModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
  load: [configuration],
  validationSchema: envValidationSchema,
  validationOptions: {
    abortEarly: true,
  },
});
