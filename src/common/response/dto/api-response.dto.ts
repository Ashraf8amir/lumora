import { ApiResponse } from '../interfaces/api-response.interface';
import { ApiResponseMetadata } from '../interfaces/api-response-metadata.interface';

export class ApiResponseDto<T> implements ApiResponse<T> {
  success: boolean;

  statusCode: number;

  message: string;

  data: T;

  metadata?: ApiResponseMetadata;

  constructor(data: T, statusCode: number, message: string, metadata?: ApiResponseMetadata) {
    this.success = true;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (metadata !== undefined) {
      this.metadata = metadata;
    }
  }
}
