import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from '../redis/redis.service';
import { JsonSerializer } from './json.serializer';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  private readonly inFlightPromises = new Map<string, Promise<any>>();

  constructor(private readonly redisService: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redisService.getClient().get(key);
      if (!raw) return null;
      return JsonSerializer.deserialize<T>(raw);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to GET cache key "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return;
    try {
      const raw = JsonSerializer.serialize(value);
      await this.redisService.getClient().set(key, raw, 'EX', ttlSeconds);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to SET cache key "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async del(key: string | string[]): Promise<void> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length === 0) return;
      await this.redisService.getClient().del(...keys);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to DEL cache keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async delByPattern(pattern: string): Promise<number> {
    try {
      const client = this.redisService.getClient();
      const stream = client.scanStream({ match: pattern, count: 250 });
      let deletedCount = 0;

      for await (const keys of stream) {
        if (keys.length > 0) {
          await client.del(...keys);
          deletedCount += keys.length;
        }
      }

      return deletedCount;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to DEL by pattern "${pattern}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return 0;
    }
  }

  async wrap<T>(key: string, ttlSeconds: number, resolver: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    if (this.inFlightPromises.has(key)) {
      return this.inFlightPromises.get(key) as Promise<T>;
    }

    const execPromise = (async () => {
      try {
        const fresh = await resolver();
        if (fresh !== undefined && fresh !== null) {
          await this.set(key, fresh, ttlSeconds);
        }
        return fresh;
      } finally {
        this.inFlightPromises.delete(key);
      }
    })();

    this.inFlightPromises.set(key, execPromise);
    return execPromise;
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!keys.length) return [];
    try {
      const raws = await this.redisService.getClient().mget(...keys);
      return raws.map((raw) => (raw ? JsonSerializer.deserialize<T>(raw) : null));
    } catch (error: unknown) {
      this.logger.error(
        `Failed to MGET cache keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return keys.map(() => null);
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redisService.getClient().ttl(key);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to get TTL for key "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return -2;
    }
  }
}
