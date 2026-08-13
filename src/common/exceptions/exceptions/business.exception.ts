import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';

interface BusinessExceptionOptions {
  statusCode?: HttpStatus;
  errorCode?: ErrorCode;
}

export class BusinessException extends HttpException {
  public readonly errorCode: ErrorCode;

  constructor(message: string, options: BusinessExceptionOptions = {}) {
    const statusCode = options.statusCode ?? HttpStatus.BAD_REQUEST;
    super(message, statusCode);

    this.errorCode = options.errorCode ?? ErrorCode.BAD_REQUEST;
  }
}
