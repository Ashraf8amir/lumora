import { Provider, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AllExceptionsFilter } from '@/common/exceptions';
import { ApiResponseInterceptor } from '@/common/response';
import { TimeoutInterceptor } from '@/common/interceptors/timeout.interceptor';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';

export const globalProviders: Provider[] = [
  { provide: APP_GUARD, useClass: ThrottlerGuard },
  { provide: APP_GUARD, useClass: JwtAccessGuard },
  { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
  { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
  { provide: APP_FILTER, useClass: AllExceptionsFilter },
  {
    provide: APP_PIPE,
    useValue: new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  },
];
