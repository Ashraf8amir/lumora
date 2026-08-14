import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DatabaseService } from '@/infrastructure/providers/mongoose/database.service';
import { RedisService } from '@/infrastructure/providers/redis/redis.service';

@Injectable()
export class AppStartupService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Startup');

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
  ) {}

  onApplicationBootstrap() {
    const env = this.configService.get<string>('app.nodeEnv');
    const port = this.configService.get<number>('app.port');
    const memoryMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

    this.logger.log('─────────────────────────────────────');
    this.logger.log(`  Environment : ${env}`);
    this.logger.log(`  Port        : ${port}`);
    this.logger.log(`  Node        : ${process.version} (${process.platform})`);
    this.logger.log(`  Memory      : ${memoryMb} MB`);
    this.logger.log(`  Database    : ${this.databaseService.getConnectionState()}`);
    this.logger.log(
      `  Redis       : ${this.redisService.isConnected() ? 'connected' : 'disconnected'}`,
    );
    this.logger.log('─────────────────────────────────────');

    if (!this.databaseService.isConnected()) {
      this.logger.error('Database is not connected. Shutting down...');
      process.exit(1);
    }
  }
}
