import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private prisma;
    private redis;
    private jwtService;
    private configService;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        success: boolean;
        data: {
            message: string;
            accessToken: string;
            refreshToken: string;
            user: {
                id: any;
                fullName: any;
                email: any;
                role: any;
                uniqueId: any;
            };
        };
    }>;
    login(email: string, password: string, deviceInfo?: any): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            fullName: any;
            email: any;
            role: any;
            uniqueId: any;
        };
    }>;
    debugUser(email: string): Promise<{
        message: string;
        inputEmail: string;
        normalizedEmail: string;
        exactMatchFound: boolean;
        exactMatchDetails: {
            id: string;
            emailInDB: string;
            isActive: boolean;
            hasPassword: boolean;
        };
        caseInsensitiveMatchFound: boolean;
        caseInsensitiveDetails: {
            id: string;
            emailInDB: string;
            isActive: boolean;
            hasPassword: boolean;
        };
    }>;
    sendOTP(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOTP(email: string, otp: string, deviceInfo?: any): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            fullName: any;
            email: any;
            role: any;
            uniqueId: any;
        };
    }>;
    resetPassword(email: string, otp: string, newPassword: string): Promise<{
        success: boolean;
        message: string;
    }>;
    adminLogin(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            fullName: any;
            email: any;
            role: any;
            uniqueId: any;
        };
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            fullName: any;
            email: any;
            role: any;
            uniqueId: any;
        };
    }>;
    updateMe(userId: string, dto: import('./dto/update-me.dto').UpdateMeDto): Promise<{
        success: boolean;
        data: {
            id: string;
            fullName: string;
            uniqueId: string;
            role: import(".prisma/client").$Enums.user_role;
            email: string;
        };
    }>;
    requestEmailChange(userId: string, newEmail: string): Promise<{
        success: boolean;
        message: string;
    }>;
    confirmEmailChange(userId: string, newEmail: string, otp: string): Promise<{
        success: boolean;
        data: {
            id: string;
            fullName: string;
            uniqueId: string;
            role: import(".prisma/client").$Enums.user_role;
            email: string;
        };
        message: string;
    }>;
    handleGoogleLogin(googleProfile: {
        googleId: string;
        email: string;
        fullName: string;
        avatarUrl?: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            fullName: any;
            email: any;
            role: any;
            uniqueId: any;
        };
    }>;
    private generateUniqueId;
    private generateTokens;
    private registerDevice;
    private sendOtpEmail;
}
