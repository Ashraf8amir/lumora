import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

import { RABBITMQ_EXCHANGES } from '@/infrastructure/rabbitmq/rabbitmq.constants';
import { EVENTS } from '@/shared/messaging/event.types';
import { ROUTING_KEYS } from '@/shared/messaging/routing-keys';
import { RabbitMqMessage } from '@/shared/messaging/message.contract';

interface UserCreatedPayload {
  userId: string;
  email: string;
}

@Injectable()
export class UsersProducer {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publishUserCreated(payload: UserCreatedPayload, correlationId: string): Promise<void> {
    const message: RabbitMqMessage<UserCreatedPayload> = {
      messageId: crypto.randomUUID(),
      correlationId,
      event: EVENTS.USER_CREATED,
      occurredAt: new Date().toISOString(),
      attempt: 1,
      payload,
    };

    await this.amqpConnection.publish(
      RABBITMQ_EXCHANGES.EVENTS,
      ROUTING_KEYS.USER_CREATED,
      message,
    );
  }
}
