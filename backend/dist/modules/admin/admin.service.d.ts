import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { QueryAdminLaundriesDto, QueryAdminUsersDto } from './dto/query-admin.dto';
import { UpdateLaundryStatusDto } from './dto/update-laundry-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
export declare class AdminService {
    private readonly prisma;
    private readonly notificationService;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    getLaundries(dto: QueryAdminLaundriesDto): Promise<{
        success: boolean;
        data: ({
            subscriptions: ({
                plan: {
                    nameAr: string;
                };
            } & {
                promoCode: string | null;
                id: string;
                isActive: boolean;
                createdAt: Date;
                laundryId: string;
                notes: string | null;
                planId: string;
                amountPaid: import("@prisma/client/runtime/library").Decimal;
                paymentMethod: string | null;
                startDate: Date;
                endDate: Date;
                createdBy: string | null;
            })[];
            _count: {
                invoices: number;
                ratings: number;
            };
            owner: {
                phoneNumber: string;
                email: string;
                fullName: string;
            };
        } & {
            id: string;
            phoneNumber: string;
            createdAt: Date;
            updatedAt: Date;
            country: string | null;
            name: string;
            nameAr: string | null;
            address: string | null;
            city: string | null;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
            workingHours: import("@prisma/client/runtime/library").JsonValue | null;
            logoUrl: string | null;
            status: import(".prisma/client").$Enums.laundry_status;
            ratingAvg: import("@prisma/client/runtime/library").Decimal | null;
            ratingCount: number | null;
            tax_enabled: boolean;
            tax_rate: import("@prisma/client/runtime/library").Decimal | null;
            urgency_enabled: boolean;
            urgency_fee: import("@prisma/client/runtime/library").Decimal | null;
            ownerId: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    getLaundryDetails(id: string): Promise<{
        success: boolean;
        data: {
            stats: {
                totalRevenue: number | import("@prisma/client/runtime/library").Decimal;
            };
            subscriptions: ({
                plan: {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    nameAr: string;
                    nameEn: string;
                    durationDays: number;
                    priceSar: import("@prisma/client/runtime/library").Decimal;
                    features: import("@prisma/client/runtime/library").JsonValue | null;
                    is_seasonal: boolean;
                    occasion_name: string | null;
                    discount_percent: import("@prisma/client/runtime/library").Decimal | null;
                    offer_valid_from: Date | null;
                    offer_valid_until: Date | null;
                };
            } & {
                promoCode: string | null;
                id: string;
                isActive: boolean;
                createdAt: Date;
                laundryId: string;
                notes: string | null;
                planId: string;
                amountPaid: import("@prisma/client/runtime/library").Decimal;
                paymentMethod: string | null;
                startDate: Date;
                endDate: Date;
                createdBy: string | null;
            })[];
            _count: {
                invoices: number;
                ratings: number;
                promotions: number;
            };
            categories: ({
                items: {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    nameAr: string;
                    sortOrder: number;
                    categoryId: string;
                    nameEn: string;
                    basePrice: import("@prisma/client/runtime/library").Decimal;
                    washing_price: import("@prisma/client/runtime/library").Decimal | null;
                    ironing_price: import("@prisma/client/runtime/library").Decimal | null;
                }[];
            } & {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                laundryId: string;
                sortOrder: number;
            })[];
            owner: {
                id: string;
                phoneNumber: string;
                email: string;
                fullName: string;
                createdAt: Date;
            };
            id: string;
            phoneNumber: string;
            createdAt: Date;
            updatedAt: Date;
            country: string | null;
            name: string;
            nameAr: string | null;
            address: string | null;
            city: string | null;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
            workingHours: import("@prisma/client/runtime/library").JsonValue | null;
            logoUrl: string | null;
            status: import(".prisma/client").$Enums.laundry_status;
            ratingAvg: import("@prisma/client/runtime/library").Decimal | null;
            ratingCount: number | null;
            tax_enabled: boolean;
            tax_rate: import("@prisma/client/runtime/library").Decimal | null;
            urgency_enabled: boolean;
            urgency_fee: import("@prisma/client/runtime/library").Decimal | null;
            ownerId: string;
        };
    }>;
    updateLaundryStatus(laundryId: string, adminId: string, dto: UpdateLaundryStatusDto): Promise<{
        success: boolean;
        data: {
            status: string;
        };
    }>;
    getLaundryDevices(laundryId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            isActive: boolean;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            deviceType: string | null;
            deviceOs: string | null;
            deviceModel: string | null;
            fcmToken: string | null;
            isPrimary: boolean;
            device_name: string | null;
        }[];
    }>;
    toggleDeviceByLaundryId(laundryId: string, deviceId: string, isActive: boolean): Promise<{
        success: boolean;
        data: {
            deviceId: string;
            isActive: boolean;
        };
    }>;
    getUsers(dto: QueryAdminUsersDto): Promise<{
        success: boolean;
        data: {
            id: string;
            phoneNumber: string;
            email: string;
            fullName: string;
            role: import(".prisma/client").$Enums.user_role;
            isActive: boolean;
            lastLoginAt: Date;
            createdAt: Date;
            _count: {
                userDevices: number;
            };
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    getUserDetails(id: string): Promise<{
        success: boolean;
        data: {
            _count: {
                invoices: number;
                laundries: number;
                userDevices: number;
            };
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
            createdAt: Date;
            updatedAt: Date;
            country: string | null;
            currency: string | null;
        };
    }>;
    updateUserStatus(userId: string, adminId: string, dto: UpdateUserStatusDto): Promise<{
        success: boolean;
        data: {
            isActive: boolean;
        };
    }>;
    getUserDevices(userId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            isActive: boolean;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            deviceType: string | null;
            deviceOs: string | null;
            deviceModel: string | null;
            fcmToken: string | null;
            isPrimary: boolean;
            device_name: string | null;
        }[];
    }>;
    toggleDevice(userId: string, deviceId: string, isActive: boolean): Promise<{
        success: boolean;
        data: {
            deviceId: string;
            isActive: boolean;
        };
    }>;
    getOverview(): Promise<{
        success: boolean;
        data: {
            laundries: {
                total: number;
                active: number;
                pending: number;
            };
            users: {
                total: number;
            };
            invoices: {
                completed: number;
            };
            revenue: {
                thisMonth: number | import("@prisma/client/runtime/library").Decimal;
            };
            alerts: {
                expiringSubscriptions: number;
            };
        };
    }>;
    getRevenueAnalytics(): Promise<{
        success: boolean;
        data: any[];
    }>;
    getTopLaundries(): Promise<{
        success: boolean;
        data: unknown;
        error?: undefined;
    } | {
        success: boolean;
        data: any[];
        error: string;
    }>;
    getSettings(): Promise<{
        success: boolean;
        data: Record<string, string>;
    }>;
    updateSetting(key: string, value: string, adminId: string): Promise<{
        success: boolean;
        data: {
            updated_at: Date;
            description: string | null;
            key: string;
            value: string;
            updated_by: string | null;
        };
    }>;
}
