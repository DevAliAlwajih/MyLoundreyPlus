import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | null = null;
  private readonly logger = new Logger('RedisService');
  private isRedisConnected = false;
  private memoryStore = new Map<string, { value: string; expiresAt?: number }>();

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', '127.0.0.1');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    try {
      this.client = new Redis({
        host,
        port,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times >= 2) {
            return null; // Stop reconnecting if server is not present
          }
          return 500;
        },
      });

      this.client.connect().then(() => {
        this.isRedisConnected = true;
        this.logger.log('✅ Redis connected successfully');
      }).catch((err) => {
        this.isRedisConnected = false;
        this.logger.warn(`⚠️ Redis is unavailable at ${host}:${port} (${err.message}). Using In-Memory fallback.`);
      });

      this.client.on('error', (err) => {
        if (this.isRedisConnected) {
          this.logger.error(`❌ Redis error: ${err.message}`);
        }
        this.isRedisConnected = false;
      });
    } catch (err) {
      this.isRedisConnected = false;
      this.logger.warn(`⚠️ Could not initialize Redis client. Using In-Memory fallback.`);
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isRedisConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch {
        // fallback to memory
      }
    }

    const item = this.memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (this.isRedisConnected && this.client) {
      try {
        if (ttl) {
          await this.client.set(key, value, 'EX', ttl);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        // fallback to memory
      }
    }

    const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined;
    this.memoryStore.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    if (this.isRedisConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch {
        // fallback to memory
      }
    }
    this.memoryStore.delete(key);
  }

  async incr(key: string): Promise<number> {
    if (this.isRedisConnected && this.client) {
      try {
        return await this.client.incr(key);
      } catch {
        // fallback to memory
      }
    }

    const current = await this.get(key);
    const next = (parseInt(current || '0', 10) || 0) + 1;
    const existing = this.memoryStore.get(key);
    this.memoryStore.set(key, { value: String(next), expiresAt: existing?.expiresAt });
    return next;
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (this.isRedisConnected && this.client) {
      try {
        await this.client.expire(key, seconds);
        return;
      } catch {
        // fallback to memory
      }
    }

    const item = this.memoryStore.get(key);
    if (item) {
      item.expiresAt = Date.now() + seconds * 1000;
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
