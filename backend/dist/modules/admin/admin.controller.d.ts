import { AdminService } from './admin.service';
import { QueryAdminLaundriesDto, QueryAdminUsersDto } from './dto/query-admin.dto';
import { UpdateLaundryStatusDto } from './dto/update-laundry-status.dto';
import { UpdateLaundryBillingDto } from './dto/update-laundry-billing.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
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
        data: Record<string, any>;
    }>;
    updateSetting(req: any, key: string, dto: UpdateSettingDto): Promise<{
        success: boolean;
        data: {
            description: string | null;
            key: string;
            value: string;
            updated_by: string | null;
            updated_at: Date;
        };
    }>;
    getLaundries(dto: QueryAdminLaundriesDto): Promise<{
        success: boolean;
        data: ({
            _count: {
                invoices: number;
                ratings: number;
            };
            subscriptions: ({
                plan: {
                    nameAr: string;
                };
            } & {
                id: string;
                startDate: Date;
                endDate: Date;
                isActive: boolean;
                createdBy: string | null;
                createdAt: Date;
                promoCode: string | null;
                laundryId: string;
                notes: string | null;
                planId: string;
                amountPaid: import("@prisma/client/runtime/library").Decimal;
                paymentMethod: string | null;
            })[];
            owner: {
                phoneNumber: string;
                email: string;
                fullName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            phoneNumber: string;
            country: string | null;
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
            billing_type: import(".prisma/client").$Enums.billing_type;
            commission_rate: import("@prisma/client/runtime/library").Decimal | null;
            trial_commission_ends_at: Date | null;
            balance: import("@prisma/client/runtime/library").Decimal;
            debt_limit: import("@prisma/client/runtime/library").Decimal | null;
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
            _count: {
                invoices: number;
                ratings: number;
                promotions: number;
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
                id: string;
                startDate: Date;
                endDate: Date;
                isActive: boolean;
                createdBy: string | null;
                createdAt: Date;
                promoCode: string | null;
                laundryId: string;
                notes: string | null;
                planId: string;
                amountPaid: import("@prisma/client/runtime/library").Decimal;
                paymentMethod: string | null;
            })[];
            categories: ({
                items: {
                    id: string;
                    sortOrder: number;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    nameAr: string;
                    categoryId: string;
                    nameEn: string;
                    basePrice: import("@prisma/client/runtime/library").Decimal;
                    washing_price: import("@prisma/client/runtime/library").Decimal | null;
                    ironing_price: import("@prisma/client/runtime/library").Decimal | null;
                }[];
            } & {
                id: string;
                sortOrder: number;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                laundryId: string;
            })[];
            owner: {
                id: string;
                createdAt: Date;
                phoneNumber: string;
                email: string;
                fullName: string;
            };
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            phoneNumber: string;
            country: string | null;
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
            billing_type: import(".prisma/client").$Enums.billing_type;
            commission_rate: import("@prisma/client/runtime/library").Decimal | null;
            trial_commission_ends_at: Date | null;
            balance: import("@prisma/client/runtime/library").Decimal;
            debt_limit: import("@prisma/client/runtime/library").Decimal | null;
            ownerId: string;
        };
    }>;
    updateLaundryStatus(req: any, id: string, dto: UpdateLaundryStatusDto): Promise<{
        success: boolean;
        data: {
            status: string;
        };
    }>;
    updateLaundryBilling(id: string, dto: UpdateLaundryBillingDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            billing_type: import(".prisma/client").$Enums.billing_type;
            commission_rate: import("@prisma/client/runtime/library").Decimal;
            trial_commission_ends_at: Date;
            balance: import("@prisma/client/runtime/library").Decimal;
            debt_limit: import("@prisma/client/runtime/library").Decimal;
        };
    }>;
    getLaundryDevices(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            lastLoginAt: Date | null;
            userId: string;
            deviceType: string | null;
            deviceOs: string | null;
            deviceModel: string | null;
            fcmToken: string | null;
            isPrimary: boolean;
            device_name: string | null;
        }[];
    }>;
    toggleLaundryDevice(id: string, deviceId: string, isActive: boolean): Promise<{
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
            isActive: boolean;
            createdAt: Date;
            _count: {
                userDevices: number;
            };
            phoneNumber: string;
            email: string;
            fullName: string;
            role: import(".prisma/client").$Enums.user_role;
            lastLoginAt: Date;
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
                laundries: number;
                invoices: number;
                userDevices: number;
            };
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            phoneNumber: string | null;
            uniqueId: string;
            email: string | null;
            fullName: string;
            qrCode: string | null;
            avatarUrl: string | null;
            role: import(".prisma/client").$Enums.user_role;
            isVerified: boolean;
            lastLoginAt: Date | null;
            country: string | null;
            currency: string | null;
            notification_prefs: import("@prisma/client/runtime/library").JsonValue | null;
        };
    }>;
    updateUserStatus(req: any, id: string, dto: UpdateUserStatusDto): Promise<{
        success: boolean;
        data: {
            isActive: boolean;
        };
    }>;
    getUserDevices(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            lastLoginAt: Date | null;
            userId: string;
            deviceType: string | null;
            deviceOs: string | null;
            deviceModel: string | null;
            fcmToken: string | null;
            isPrimary: boolean;
            device_name: string | null;
        }[];
    }>;
    toggleUserDevice(id: string, deviceId: string, isActive: boolean): Promise<{
        success: boolean;
        data: {
            deviceId: string;
            isActive: boolean;
        };
    }>;
}
