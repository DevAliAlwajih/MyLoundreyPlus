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
            owner: {
                phoneNumber: string;
                fullName: string;
                email: string;
            };
            subscriptions: ({
                plan: {
                    nameAr: string;
                };
            } & {
                id: string;
                createdAt: Date;
                isActive: boolean;
                laundryId: string;
                planId: string;
                amountPaid: import("@prisma/client/runtime/library").Decimal;
                paymentMethod: string | null;
                promoCode: string | null;
                startDate: Date;
                endDate: Date;
                notes: string | null;
                createdBy: string | null;
            })[];
            _count: {
                invoices: number;
                ratings: number;
            };
        } & {
            id: string;
            ownerId: string;
            name: string;
            nameAr: string | null;
            phoneNumber: string;
            address: string | null;
            city: string | null;
            country: string | null;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
            workingHours: import("@prisma/client/runtime/library").JsonValue | null;
            logoUrl: string | null;
            status: import(".prisma/client").$Enums.laundry_status;
            ratingAvg: import("@prisma/client/runtime/library").Decimal | null;
            ratingCount: number | null;
            createdAt: Date;
            updatedAt: Date;
            tax_enabled: boolean;
            tax_rate: import("@prisma/client/runtime/library").Decimal | null;
            urgency_enabled: boolean;
            urgency_fee: import("@prisma/client/runtime/library").Decimal | null;
            billing_type: import(".prisma/client").$Enums.billing_type;
            commission_rate: import("@prisma/client/runtime/library").Decimal | null;
            trial_commission_ends_at: Date | null;
            balance: import("@prisma/client/runtime/library").Decimal;
            debt_limit: import("@prisma/client/runtime/library").Decimal | null;
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
            categories: ({
                items: {
                    id: string;
                    nameAr: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                    nameEn: string;
                    sortOrder: number;
                    categoryId: string;
                    basePrice: import("@prisma/client/runtime/library").Decimal;
                    washing_price: import("@prisma/client/runtime/library").Decimal | null;
                    ironing_price: import("@prisma/client/runtime/library").Decimal | null;
                }[];
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                laundryId: string;
                sortOrder: number;
            })[];
            owner: {
                id: string;
                phoneNumber: string;
                createdAt: Date;
                fullName: string;
                email: string;
            };
            subscriptions: ({
                plan: {
                    id: string;
                    nameAr: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
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
                createdAt: Date;
                isActive: boolean;
                laundryId: string;
                planId: string;
                amountPaid: import("@prisma/client/runtime/library").Decimal;
                paymentMethod: string | null;
                promoCode: string | null;
                startDate: Date;
                endDate: Date;
                notes: string | null;
                createdBy: string | null;
            })[];
            _count: {
                invoices: number;
                promotions: number;
                ratings: number;
            };
            id: string;
            ownerId: string;
            name: string;
            nameAr: string | null;
            phoneNumber: string;
            address: string | null;
            city: string | null;
            country: string | null;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
            workingHours: import("@prisma/client/runtime/library").JsonValue | null;
            logoUrl: string | null;
            status: import(".prisma/client").$Enums.laundry_status;
            ratingAvg: import("@prisma/client/runtime/library").Decimal | null;
            ratingCount: number | null;
            createdAt: Date;
            updatedAt: Date;
            tax_enabled: boolean;
            tax_rate: import("@prisma/client/runtime/library").Decimal | null;
            urgency_enabled: boolean;
            urgency_fee: import("@prisma/client/runtime/library").Decimal | null;
            billing_type: import(".prisma/client").$Enums.billing_type;
            commission_rate: import("@prisma/client/runtime/library").Decimal | null;
            trial_commission_ends_at: Date | null;
            balance: import("@prisma/client/runtime/library").Decimal;
            debt_limit: import("@prisma/client/runtime/library").Decimal | null;
        };
    }>;
    updateLaundryStatus(laundryId: string, adminId: string, dto: UpdateLaundryStatusDto): Promise<{
        success: boolean;
        data: {
            status: string;
        };
    }>;
    updateLaundryBilling(laundryId: string, dto: import('./dto/update-laundry-billing.dto').UpdateLaundryBillingDto): Promise<{
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
    getLaundryDevices(laundryId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
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
    toggleDeviceByLaundryId(laundryId: string, deviceId: string, isActive: boolean): Promise<{
        success: boolean;
        data: {
            deviceId: string;
            isActive: boolean;
        };
    }>;
    deleteLaundry(laundryId: string, adminId: string, adminPassword?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteUser(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getUsers(dto: QueryAdminUsersDto): Promise<{
        success: boolean;
        data: {
            id: string;
            phoneNumber: string;
            createdAt: Date;
            _count: {
                userDevices: number;
            };
            fullName: string;
            role: import(".prisma/client").$Enums.user_role;
            isActive: boolean;
            lastLoginAt: Date;
            email: string;
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
            country: string | null;
            createdAt: Date;
            updatedAt: Date;
            fullName: string;
            uniqueId: string;
            qrCode: string | null;
            avatarUrl: string | null;
            role: import(".prisma/client").$Enums.user_role;
            isActive: boolean;
            isVerified: boolean;
            lastLoginAt: Date | null;
            email: string | null;
            currency: string | null;
            notification_prefs: import("@prisma/client/runtime/library").JsonValue | null;
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
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
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
        data: Record<string, any>;
    }>;
    updateSetting(key: string, value: string, adminId: string): Promise<{
        success: boolean;
        data: {
            key: string;
            value: string;
            description: string | null;
            updated_by: string | null;
            updated_at: Date;
        };
    }>;
}
