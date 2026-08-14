import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { ThrottlerModule } from '@nestjs/throttler';
import { v4 as uuid } from 'uuid';

import { DatabaseModule } from '@/infrastructure/providers/mongoose/database.module';
import { RedisModule } from '@/infrastructure/providers/redis/redis.module';
import { ConfigurationModule } from '@config/configuration.module';

@Global()
@Module({
  imports: [
    ConfigurationModule,
    DatabaseModule,
    RedisModule,
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req) => (req.headers['x-request-id'] as string) ?? uuid(),
      },
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10_000, limit: 20 },
      { name: 'long', ttl: 60_000, limit: 100 },
    ]),
  ],
  exports: [DatabaseModule, RedisModule, ClsModule, ThrottlerModule, ConfigurationModule],
})
export class GlobalModule {}
