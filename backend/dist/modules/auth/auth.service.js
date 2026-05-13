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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../common/redis/redis.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
let AuthService = class AuthService {
    constructor(prisma, redis, jwtService, configService) {
        this.prisma = prisma;
        this.redis = redis;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async sendOTP(phoneNumber) {
        const phoneRegex = /^\+9[67]\d{8,9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            throw new common_1.BadRequestException('رقم الهاتف غير صالح. يجب أن يبدأ بـ +966 أو +967');
        }
        const rateLimitKey = `rate:otp:${phoneNumber}`;
        const attempts = await this.redis.incr(rateLimitKey);
        if (attempts === 1)
            await this.redis.expire(rateLimitKey, 3600);
        if (attempts > 3) {
            throw new common_1.ForbiddenException('تجاوزت الحد المسموح. حاول بعد ساعة');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpKey = `otp:${phoneNumber}`;
        await this.redis.set(otpKey, otp, 300);
        console.log(`[SMS Gateway] OTP for ${phoneNumber}: ${otp}`);
        return { success: true, message: 'تم إرسال رمز التحقق' };
    }
    async verifyOTP(phoneNumber, otp, deviceInfo) {
        const otpKey = `otp:${phoneNumber}`;
        const storedOtp = await this.redis.get(otpKey);
        if (!storedOtp || storedOtp !== otp) {
            throw new common_1.UnauthorizedException('رمز التحقق غير صحيح أو منتهي الصلاحية');
        }
        await this.redis.del(otpKey);
        let user = await this.prisma.user.findUnique({
            where: { phoneNumber },
        });
        if (!user) {
            const uniqueId = this.generateUniqueId();
            user = await this.prisma.user.create({
                data: {
                    phoneNumber,
                    fullName: 'عميل جديد',
                    uniqueId,
                    role: 'customer',
                    isVerified: true,
                },
            });
        }
        else {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
        }
        await this.registerDevice(user.id, deviceInfo);
        return this.generateTokens(user);
    }
    async adminLogin(email, pass) {
        const user = await this.prisma.user.findFirst({
            where: { phoneNumber: email, role: 'admin' },
        });
    }
    generateUniqueId() {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }
    async generateTokens(user) {
        const payload = { sub: user.id, role: user.role };
        return {
            accessToken: await this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_ACCESS_SECRET'),
                expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
            }),
            refreshToken: await this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
            }),
            user: {
                id: user.id,
                fullName: user.fullName,
                role: user.role,
                uniqueId: user.uniqueId,
            },
        };
    }
    async registerDevice(userId, info) {
        const deviceCount = await this.prisma.userDevice.count({
            where: { userId },
        });
        const maxDevices = 3;
        if (deviceCount >= maxDevices) {
        }
        const isPrimary = deviceCount === 0;
        await this.prisma.userDevice.upsert({
            where: { id: info.deviceId || (0, uuid_1.v4)() },
            update: {
                fcmToken: info.fcmToken,
                lastLoginAt: new Date(),
                isActive: true,
            },
            create: {
                id: info.deviceId || (0, uuid_1.v4)(),
                userId,
                deviceType: info.deviceType,
                deviceOs: info.deviceOs,
                deviceModel: info.deviceModel,
                fcmToken: info.fcmToken,
                isActive: true,
                isPrimary,
            },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map