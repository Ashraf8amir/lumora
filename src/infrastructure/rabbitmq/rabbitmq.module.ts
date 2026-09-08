import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule, RabbitMQConfig } from '@golevelup/nestjs-rabbitmq';
import { RABBITMQ_EXCHANGES, RABBITMQ_QUEUES } from './rabbitmq.constants';
import { ROUTING_KEYS } from '../../shared/messaging/routing-keys';
import { RabbitMqRetryPublisher } from './retry/rabbitmq-retry.publisher';
import { RabbitMqRetryPolicy } from './retry/rabbitmq-retry.policy';
import { RabbitMqMessageHandler } from './rabbitmq.message-handler';

@Module({
  imports: [
    ConfigModule,
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService): RabbitMQConfig => {
        const isProd = configService.getOrThrow<string>('NODE_ENV') === 'production';
        const rawUri = configService.getOrThrow<string>('RABBITMQ_URI');

        return {
          uri: rawUri.includes(',') ? rawUri.split(',').map((u) => u.trim()) : rawUri,

          connectionInitOptions: {
            wait: true,
            timeout: 15_000,
            reject: isProd,
          },

          connectionManagerOptions: {
            heartbeatIntervalInSeconds: 15,
            reconnectTimeInSeconds: 5,
          },

          exchanges: [
            {
              name: RABBITMQ_EXCHANGES.EVENTS,
              type: 'topic',
            },

            {
              name: RABBITMQ_EXCHANGES.RETRY,
              type: 'direct',
            },

            {
              name: RABBITMQ_EXCHANGES.DLX,
              type: 'direct',
            },
          ],

          queues: [
            {
              name: RABBITMQ_QUEUES.USER_CREATED,
              exchange: RABBITMQ_EXCHANGES.EVENTS,
              routingKey: ROUTING_KEYS.USER_CREATED,

              options: {
                durable: true,
                deadLetterExchange: RABBITMQ_EXCHANGES.DLX,
                deadLetterRoutingKey: ROUTING_KEYS.USER_CREATED_DLQ,
              },
            },

            {
              name: RABBITMQ_QUEUES.USER_CREATED_RETRY_5S,
              exchange: RABBITMQ_EXCHANGES.RETRY,
              routingKey: ROUTING_KEYS.USER_CREATED_RETRY_5S,

              options: {
                durable: true,
                messageTtl: 5_000,
                deadLetterExchange: RABBITMQ_EXCHANGES.EVENTS,
                deadLetterRoutingKey: ROUTING_KEYS.USER_CREATED,
              },
            },

            {
              name: RABBITMQ_QUEUES.USER_CREATED_RETRY_30S,
              exchange: RABBITMQ_EXCHANGES.RETRY,
              routingKey: ROUTING_KEYS.USER_CREATED_RETRY_30S,

              options: {
                durable: true,
                messageTtl: 30_000,
                deadLetterExchange: RABBITMQ_EXCHANGES.EVENTS,
                deadLetterRoutingKey: ROUTING_KEYS.USER_CREATED,
              },
            },

            {
              name: RABBITMQ_QUEUES.USER_CREATED_RETRY_5M,
              exchange: RABBITMQ_EXCHANGES.RETRY,
              routingKey: ROUTING_KEYS.USER_CREATED_RETRY_5M,

              options: {
                durable: true,
                messageTtl: 300_000,
                deadLetterExchange: RABBITMQ_EXCHANGES.EVENTS,
                deadLetterRoutingKey: ROUTING_KEYS.USER_CREATED,
              },
            },

            {
              name: RABBITMQ_QUEUES.USER_CREATED_DLQ,
              exchange: RABBITMQ_EXCHANGES.DLX,
              routingKey: ROUTING_KEYS.USER_CREATED_DLQ,

              options: { durable: true },
            },
          ],
        };
      },
    }),
  ],

  providers: [RabbitMqMessageHandler, RabbitMqRetryPolicy, RabbitMqRetryPublisher],

  exports: [RabbitMQModule, RabbitMqMessageHandler, RabbitMqRetryPolicy, RabbitMqRetryPublisher],
})
export class RabbitMqInfrastructureModule {}
