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
            phoneNumber: string;
            uniqueId: string;
            email: string;
            fullName: string;
            qrCode: string;
            avatarUrl: string;
            role: import(".prisma/client").$Enums.user_role;
            isVerified: boolean;
            createdAt: Date;
            country: string;
            currency: string;
        };
    }>;
    updateProfile(req: any, dto: UpdateProfileDto): Promise<{
        success: boolean;
        data: {
            id: string;
            phoneNumber: string;
            uniqueId: string;
            email: string;
            fullName: string;
            qrCode: string;
            avatarUrl: string;
            role: import(".prisma/client").$Enums.user_role;
            isVerified: boolean;
            createdAt: Date;
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
}
