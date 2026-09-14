"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisService = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.client = null;
        this.logger = new common_1.Logger('RedisService');
        this.isRedisConnected = false;
        this.memoryStore = new Map();
        const host = this.configService.get('REDIS_HOST', '127.0.0.1');
        const port = this.configService.get('REDIS_PORT', 6379);
        try {
            this.client = new ioredis_1.default({
                host,
                port,
                lazyConnect: true,
                maxRetriesPerRequest: 1,
                retryStrategy: (times) => {
                    if (times >= 2) {
                        return null;
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
        }
        catch (err) {
            this.isRedisConnected = false;
            this.logger.warn(`⚠️ Could not initialize Redis client. Using In-Memory fallback.`);
        }
    }
    async get(key) {
        if (this.isRedisConnected && this.client) {
            try {
                return await this.client.get(key);
            }
            catch {
            }
        }
        const item = this.memoryStore.get(key);
        if (!item)
            return null;
        if (item.expiresAt && Date.now() > item.expiresAt) {
            this.memoryStore.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value, ttl) {
        if (this.isRedisConnected && this.client) {
            try {
                if (ttl) {
                    await this.client.set(key, value, 'EX', ttl);
                }
                else {
                    await this.client.set(key, value);
                }
                return;
            }
            catch {
            }
        }
        const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined;
        this.memoryStore.set(key, { value, expiresAt });
    }
    async del(key) {
        if (this.isRedisConnected && this.client) {
            try {
                await this.client.del(key);
                return;
            }
            catch {
            }
        }
        this.memoryStore.delete(key);
    }
    async incr(key) {
        if (this.isRedisConnected && this.client) {
            try {
                return await this.client.incr(key);
            }
            catch {
            }
        }
        const current = await this.get(key);
        const next = (parseInt(current || '0', 10) || 0) + 1;
        const existing = this.memoryStore.get(key);
        this.memoryStore.set(key, { value: String(next), expiresAt: existing?.expiresAt });
        return next;
    }
    async expire(key, seconds) {
        if (this.isRedisConnected && this.client) {
            try {
                await this.client.expire(key, seconds);
                return;
            }
            catch {
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
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map