import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: any): Promise<{
        id: string;
        phoneNumber: string | null;
        uniqueId: string;
        email: string | null;
        fullName: string;
        qrCode: string | null;
        avatarUrl: string | null;
        role: import(".prisma/client").$Enums.user_role;
        isActive: boolean;
        isVerified: boolean;
        lastLoginAt: Date | null;
        deviceToken: string | null;
        createdAt: Date;
        updatedAt: Date;
        password_hash: string | null;
        country: string | null;
        currency: string | null;
    }>;
}
export {};
