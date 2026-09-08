import { Provider, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AllExceptionsFilter } from '@/common/exceptions';
import { ApiResponseInterceptor } from '@/common/response';
import { TimeoutInterceptor } from '@/common/interceptors/timeout.interceptor';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { AppThrottlerGuard } from '@/common/guards/app-throttler.guard';

export const globalProviders: Provider[] = [
  { provide: APP_GUARD, useClass: AppThrottlerGuard },
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
