import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RABBITMQ_EXCHANGES } from '../rabbitmq.constants';
import { RabbitMqMessage } from '../../../shared/messaging/message.contract';

@Injectable()
export class RabbitMqRetryPublisher {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publish(message: RabbitMqMessage<unknown>, routingKey: string): Promise<void> {
    await this.amqpConnection.publish(RABBITMQ_EXCHANGES.RETRY, routingKey, message);
  }
}
