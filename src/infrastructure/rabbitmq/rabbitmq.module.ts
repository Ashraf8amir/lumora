import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule, RabbitMQConfig } from '@golevelup/nestjs-rabbitmq';
import { RABBITMQ_EXCHANGES, RABBITMQ_QUEUES, RABBITMQ_ROUTING_KEYS } from './rabbitmq.constants';

@Module({
  imports: [
    ConfigModule,

    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (configService: ConfigService): RabbitMQConfig => ({
        uri: configService.getOrThrow<string>('RABBITMQ_URI'),

        exchanges: [
          {
            name: RABBITMQ_EXCHANGES.EVENTS,
            type: 'topic',
          },
        ],

        queues: [
          {
            name: RABBITMQ_QUEUES.USER_CREATED,
            exchange: RABBITMQ_EXCHANGES.EVENTS,
            routingKey: RABBITMQ_ROUTING_KEYS.USER_CREATED,
          },
        ],

        connectionInitOptions: {
          wait: true,
          timeout: 10_000,
        },

        connectionManagerOptions: {
          heartbeatIntervalInSeconds: 10,
          reconnectTimeInSeconds: 5,
        },
      }),
    }),
  ],

  exports: [RabbitMQModule],
})
export class RabbitMqInfrastructureModule {}
