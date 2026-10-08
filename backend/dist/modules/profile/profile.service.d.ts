import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
export declare class ProfileService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            fullName: string;
            phoneNumber: string;
            uniqueId: string;
            qrCode: string;
            avatarUrl: string;
            role: import(".prisma/client").$Enums.user_role;
            isVerified: boolean;
            createdAt: Date;
            email: string;
            country: string;
            currency: string;
        };
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        success: boolean;
        data: {
            id: string;
            fullName: string;
            phoneNumber: string;
            uniqueId: string;
            qrCode: string;
            avatarUrl: string;
            role: import(".prisma/client").$Enums.user_role;
            isVerified: boolean;
            createdAt: Date;
            email: string;
            country: string;
            currency: string;
        };
    }>;
    updatePassword(userId: string, dto: UpdatePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getDevices(userId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            isActive: boolean;
            lastLoginAt: Date;
            deviceType: string;
            deviceOs: string;
            deviceModel: string;
            isPrimary: boolean;
            device_name: string;
        }[];
    }>;
    deactivateDevice(userId: string, deviceId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getNotificationPrefs(userId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    updateNotificationPrefs(userId: string, prefs: any): Promise<{
        success: boolean;
        data: import("@prisma/client/runtime/library").JsonValue;
    }>;
    updateDeviceToken(userId: string, fcmToken: string, deviceId?: string): Promise<{
        success: boolean;
    }>;
}
