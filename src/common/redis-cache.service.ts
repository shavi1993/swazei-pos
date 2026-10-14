import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/** Best-effort cache: database remains the source of truth if Redis is unavailable. */
@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      enableOfflineQueue: false,
    });
    this.redis.on('error', () => undefined);
  }
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redis.status === 'wait') await this.redis.connect();
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) as T : null;
    } catch { return null; }
  }
  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    try {
      if (this.redis.status === 'wait') await this.redis.connect();
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch { /* Cache failures must not fail the API request. */ }
  }
  async deleteByPrefix(prefix: string): Promise<void> {
    try {
      if (this.redis.status === 'wait') await this.redis.connect();
      const keys = await this.redis.keys(`${prefix}*`);
      if (keys.length) await this.redis.del(...keys);
    } catch { /* Cache failures must not fail the API request. */ }
  }
  async onModuleDestroy() { await this.redis.quit().catch(() => undefined); }
}
