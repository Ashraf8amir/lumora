import { ErrorCode } from '../enums/error-code.enum';

export interface ErrorResponse {
  success: false;
  statusCode: number;
  errorCode?: ErrorCode | undefined;
  message: string | object;
  method: string;
  path: string;
  timestamp: string;
  requestId?: string | undefined;
  stack?: string | undefined;
}
