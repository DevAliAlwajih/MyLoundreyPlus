import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export declare class AuthService {
    private prisma;
    private redis;
    private jwtService;
    private configService;
    constructor(prisma: PrismaService, redis: RedisService, jwtService: JwtService, configService: ConfigService);
    sendOTP(phoneNumber: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOTP(phoneNumber: string, otp: string, deviceInfo: any): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            fullName: any;
            role: any;
            uniqueId: any;
        };
    }>;
    adminLogin(email: string, pass: string): Promise<void>;
    private generateUniqueId;
    private generateTokens;
    private registerDevice;
}
