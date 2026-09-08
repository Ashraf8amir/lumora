import { Injectable } from '@nestjs/common';
import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

import { RABBITMQ_EXCHANGES, RABBITMQ_QUEUES } from '@/infrastructure/rabbitmq/rabbitmq.constants';

import { RabbitMqMessageHandler } from '@infrastructure/rabbitmq/rabbitmq.message-handler';

import type { RabbitMqMessage } from '@/shared/messaging/message.contract';
import { ROUTING_KEYS } from '@/shared/messaging/routing-keys';

interface UserCreatedPayload {
  userId: string;
  email: string;
}

@Injectable()
export class UserCreatedConsumer {
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
      await this.handleUserCreated(message.payload);
    });
  }

  private async handleUserCreated(payload: UserCreatedPayload): Promise<void> {
    console.log(`Processing user: ${payload.userId}`);
  }
}
