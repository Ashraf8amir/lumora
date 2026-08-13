import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';

import { BusinessException } from '../exceptions/business.exception';
import { ErrorResponse } from '../interfaces/error-response.interface';
import { ErrorCode } from '../enums/error-code.enum';
import { Environment } from '../../enums/environment.enum';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly isProduction = process.env.NODE_ENV === Environment.Production;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly cls: ClsService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isHttpException = exception instanceof HttpException;

    const statusCode = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.extractMessage(exception);
    const errorCode = this.extractErrorCode(exception);
    const requestId = this.cls?.getId?.();
    const errorStack = this.extractStack(exception);

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode,
      errorCode,
      method: request.method,
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId,
      message,
      stack: this.isProduction ? undefined : errorStack,
    };

    this.logException(exception, errorResponse);

    httpAdapter.reply(response, errorResponse, statusCode);
  }

  private extractStack(exception: unknown): string | undefined {
    return exception instanceof Error ? exception.stack : undefined;
  }

  private extractErrorCode(exception: unknown): ErrorCode | undefined {
    return exception instanceof BusinessException ? exception.errorCode : undefined;
  }

  private extractMessage(exception: unknown): string | object {
    if (exception instanceof BusinessException) {
      return exception.getResponse();
    } else if (exception instanceof HttpException) {
      const res = exception.getResponse();
      return res && typeof res === 'object' && 'message' in res
        ? (res as any).message
        : exception.message;
    } else if (exception instanceof Error) {
      return exception.message;
    }
    return 'Internal server error';
  }

  private logException(exception: unknown, errorRes: ErrorResponse): void {
    const logMessage = `[${errorRes.method}] ${errorRes.path} - Status: ${errorRes.statusCode} - Message: ${JSON.stringify(errorRes.message)}`;

    if (errorRes.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(logMessage, this.extractStack(exception));
    } else {
      this.logger.warn(logMessage);
    }
  }
}
