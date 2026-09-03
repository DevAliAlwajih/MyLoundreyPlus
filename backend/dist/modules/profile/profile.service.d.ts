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
            createdAt: Date;
            phoneNumber: string;
            uniqueId: string;
            email: string;
            fullName: string;
            qrCode: string;
            avatarUrl: string;
            role: import(".prisma/client").$Enums.user_role;
            isVerified: boolean;
            country: string;
            currency: string;
        };
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            phoneNumber: string;
            uniqueId: string;
            email: string;
            fullName: string;
            qrCode: string;
            avatarUrl: string;
            role: import(".prisma/client").$Enums.user_role;
            isVerified: boolean;
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
        data: string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | {
            newBooking: boolean;
            invoiceStatus: boolean;
            paymentReceived: boolean;
            systemAlerts: boolean;
        };
    }>;
    updateNotificationPrefs(userId: string, prefs: any): Promise<{
        success: boolean;
        data: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
