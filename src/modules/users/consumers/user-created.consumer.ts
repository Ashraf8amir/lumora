import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RABBITMQ_EXCHANGES, RABBITMQ_QUEUES } from '@/infrastructure/rabbitmq/rabbitmq.constants';
import { ROUTING_KEYS } from '@/shared/messaging/routing-keys';
import type { RabbitMqMessage } from '../../../shared/messaging/message.contract';

interface UserCreatedPayload {
  userId: string;
  email: string;
}

@Injectable()
export class UserCreatedConsumer {
  @RabbitSubscribe({
    exchange: RABBITMQ_EXCHANGES.EVENTS,
    routingKey: ROUTING_KEYS.USER_CREATED,
    queue: RABBITMQ_QUEUES.USER_CREATED,
  })
  async handle(message: RabbitMqMessage<UserCreatedPayload>): Promise<void> {
    console.log('User created event received:', message);

    await this.handleUserCreated(message.payload);
  }

  private async handleUserCreated(payload: UserCreatedPayload): Promise<void> {
    console.log('Processing user:', payload.userId);
  }
}
