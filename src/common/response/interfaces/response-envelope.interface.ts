import { ApiResponseMetadata } from './api-response-metadata.interface';

export interface ResponseEnvelope<T> {
  data: T;
  metadata?: ApiResponseMetadata;
}

export function isResponseEnvelope<T>(value: unknown): value is ResponseEnvelope<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'metadata' in value &&
    typeof (value as Record<string, any>).metadata === 'object'
  );
}
