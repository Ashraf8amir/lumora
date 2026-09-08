import { Injectable, Logger } from '@nestjs/common';
import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

import { RABBITMQ_EXCHANGES, RABBITMQ_QUEUES } from '@/infrastructure/rabbitmq/rabbitmq.constants';

import { RabbitMqMessageHandler } from '@infrastructure/rabbitmq/rabbitmq.message-handler';

import type { RabbitMqMessage } from '@/shared/messaging/message.contract';
import { ROUTING_KEYS } from '@/shared/messaging/routing-keys';
import { NonRetryableMessagingError } from '@/shared/messaging/errors/non-retryable-messaging.error';

interface UserCreatedPayload {
  userId: string;
  email: string;
}

@Injectable()
export class UserCreatedConsumer {
  private readonly logger = new Logger(UserCreatedConsumer.name);

  constructor(private readonly messageHandler: RabbitMqMessageHandler) {}

  @RabbitSubscribe({
    exchange: RABBITMQ_EXCHANGES.EVENTS,
    routingKey: ROUTING_KEYS.USER_CREATED,
    queue: RABBITMQ_QUEUES.USER_CREATED,
    queueOptions: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': RABBITMQ_EXCHANGES.DLX,
        'x-dead-letter-routing-key': ROUTING_KEYS.USER_CREATED_DLQ,
      },
    },
  })
  async handle(message: RabbitMqMessage<UserCreatedPayload>): Promise<void | Nack> {
    return this.messageHandler.execute(message, async () => {
      this.logger.log(`Event Received Successfully!`);
      await this.handleUserCreated();
    });
  }

  private async handleUserCreated(): Promise<void> {
    throw new NonRetryableMessagingError('Invalid user payload data');
  }
}
