import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';
import { ApiResponseDto } from '../dto/api-response.dto';
import { ApiResponse } from '../interfaces/api-response.interface';
import { isResponseEnvelope } from '../interfaces/response-envelope.interface';

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();

    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'Request successful';

    return next.handle().pipe(
      map((result): ApiResponse<T> => {
        const statusCode = response.statusCode ?? 200;

        if (isResponseEnvelope<T>(result)) {
          return new ApiResponseDto<T>(
            (result.data ?? null) as T,
            statusCode,
            message,
            result.metadata,
          );
        }

        return new ApiResponseDto<T>((result ?? null) as T, statusCode, message);
      }),
    );
  }
}
