import { MessagingError } from './messaging-error';

export class NonRetryableMessagingError extends MessagingError {
  readonly retryable = false;
}
