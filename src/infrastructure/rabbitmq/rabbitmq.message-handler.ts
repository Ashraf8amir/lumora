import { Injectable, Logger } from '@nestjs/common';
import { Nack } from '@golevelup/nestjs-rabbitmq';

import { RabbitMqMessage } from '@/shared/messaging/message.contract';
import { NonRetryableMessagingError } from '@shared/messaging/errors/non-retryable-messaging.error';
import { RetryableMessagingError } from '@shared/messaging/errors/retryable-messaging.error';

import { RabbitMqRetryPolicy } from './retry/rabbitmq-retry.policy';
import { RabbitMqRetryPublisher } from './retry/rabbitmq-retry.publisher';

@Injectable()
export class RabbitMqMessageHandler {
  private readonly logger = new Logger(RabbitMqMessageHandler.name);

  constructor(
    private readonly retryPolicy: RabbitMqRetryPolicy,
    private readonly retryPublisher: RabbitMqRetryPublisher,
  ) {}

  async execute<T>(
    message: RabbitMqMessage<T>,
    handler: () => Promise<void>,
  ): Promise<void | Nack> {
    try {
      await handler();

      return;
    } catch (error) {
      if (error instanceof NonRetryableMessagingError) {
        this.logger.error(`Non-retryable message failure: ${message.messageId}`, error.stack);

        return new Nack(false);
      }

      if (error instanceof RetryableMessagingError) {
        return this.handleRetryableError(message, error);
      }

      this.logger.error(
        `Unknown message failure: ${message.messageId}`,
        error instanceof Error ? error.stack : undefined,
      );

      return new Nack(false);
    }
  }

  private async handleRetryableError<T>(
    message: RabbitMqMessage<T>,
    error: RetryableMessagingError,
  ): Promise<void | Nack> {
    const decision = this.retryPolicy.decide(message.event, message.attempt);

    if (!decision.shouldRetry) {
      this.logger.error(`Message retry attempts exhausted: ${message.messageId}`, error.stack);

      return new Nack(false);
    }

    try {
      await this.retryPublisher.publish(
        {
          ...message,
          attempt: decision.nextAttempt!,
        },
        decision.routingKey!,
      );

      this.logger.warn(`Message scheduled for retry: ${message.messageId}`);

      return;
    } catch (retryError) {
      this.logger.error(
        `Failed to publish message to retry queue: ${message.messageId}`,
        retryError instanceof Error ? retryError.stack : undefined,
      );

      return new Nack(false);
    }
  }
}
