import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: any): Promise<{
        laundryId: string;
        id: string;
        fullName: string;
        phoneNumber: string;
        uniqueId: string;
        role: import(".prisma/client").$Enums.user_role;
        isActive: boolean;
    }>;
}
export {};
