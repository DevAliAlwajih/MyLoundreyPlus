import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
export declare class ProfileController {
    private readonly profileService;
    constructor(profileService: ProfileService);
    getProfile(req: any): Promise<{
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
    updateProfile(req: any, dto: UpdateProfileDto): Promise<{
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
    updatePassword(req: any, dto: UpdatePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getDevices(req: any): Promise<{
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
    deactivateDevice(req: any, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getNotificationPrefs(req: any): Promise<{
        success: boolean;
        data: any;
    }>;
    updateNotificationPrefs(req: any, prefs: any): Promise<{
        success: boolean;
        data: import("@prisma/client/runtime/library").JsonValue;
    }>;
    updateDeviceToken(req: any, body: {
        fcmToken: string;
        deviceId?: string;
    }): Promise<{
        success: boolean;
    }>;
}
