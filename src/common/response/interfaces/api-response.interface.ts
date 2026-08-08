import { ApiResponseMetadata } from './api-response-metadata.interface';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  metadata?: ApiResponseMetadata;
}
