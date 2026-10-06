import { AdminService } from './admin.service';
import { QueryAdminLaundriesDto, QueryAdminUsersDto } from './dto/query-admin.dto';
import { UpdateLaundryStatusDto } from './dto/update-laundry-status.dto';
import { UpdateLaundryBillingDto } from './dto/update-laundry-billing.dto';
import { RechargeBalanceDto } from './dto/recharge-balance.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpdateLaundryDto } from '../laundry/dto/update-laundry.dto';
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
            key: string;
            value: string;
            description: string | null;
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
                laundryId: string;
                notes: string | null;
                createdAt: Date;
                isActive: boolean;
                promoCode: string | null;
                paymentMethod: string | null;
                planId: string;
                amountPaid: import("@prisma/client/runtime/library").Decimal;
                startDate: Date;
                endDate: Date;
                createdBy: string | null;
            })[];
        } & {
            id: string;
            status: import(".prisma/client").$Enums.laundry_status;
            createdAt: Date;
            updatedAt: Date;
            urgency_fee: import("@prisma/client/runtime/library").Decimal | null;
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
            ratingAvg: import("@prisma/client/runtime/library").Decimal | null;
            ratingCount: number | null;
            tax_enabled: boolean;
            tax_rate: import("@prisma/client/runtime/library").Decimal | null;
            urgency_enabled: boolean;
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
            _count: {
                invoices: number;
                promotions: number;
                ratings: number;
            };
            categories: ({
                items: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    nameAr: string;
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
                laundryId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                sortOrder: number;
            })[];
            owner: {
                id: string;
                createdAt: Date;
                phoneNumber: string;
                fullName: string;
                email: string;
            };
            subscriptions: ({
                plan: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    nameAr: string;
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
                laundryId: string;
                notes: string | null;
                createdAt: Date;
                isActive: boolean;
                promoCode: string | null;
                paymentMethod: string | null;
                planId: string;
                amountPaid: import("@prisma/client/runtime/library").Decimal;
                startDate: Date;
                endDate: Date;
                createdBy: string | null;
            })[];
            id: string;
            status: import(".prisma/client").$Enums.laundry_status;
            createdAt: Date;
            updatedAt: Date;
            urgency_fee: import("@prisma/client/runtime/library").Decimal | null;
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
            ratingAvg: import("@prisma/client/runtime/library").Decimal | null;
            ratingCount: number | null;
            tax_enabled: boolean;
            tax_rate: import("@prisma/client/runtime/library").Decimal | null;
            urgency_enabled: boolean;
            billing_type: import(".prisma/client").$Enums.billing_type;
            commission_rate: import("@prisma/client/runtime/library").Decimal | null;
            trial_commission_ends_at: Date | null;
            balance: import("@prisma/client/runtime/library").Decimal;
            debt_limit: import("@prisma/client/runtime/library").Decimal | null;
        };
    }>;
    updateLaundryDetails(id: string, dto: UpdateLaundryDto): Promise<{
        success: boolean;
        data: {
            stats: {
                totalRevenue: number | import("@prisma/client/runtime/library").Decimal;
            };
            _count: {
                invoices: number;
                promotions: number;
                ratings: number;
            };
            categories: ({
                items: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    nameAr: string;
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
                laundryId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                sortOrder: number;
            })[];
            owner: {
                id: string;
                createdAt: Date;
                phoneNumber: string;
                fullName: string;
                email: string;
            };
            subscriptions: ({
                plan: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    nameAr: string;
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
                laundryId: string;
                notes: string | null;
                createdAt: Date;
                isActive: boolean;
                promoCode: string | null;
                paymentMethod: string | null;
                planId: string;
                amountPaid: import("@prisma/client/runtime/library").Decimal;
                startDate: Date;
                endDate: Date;
                createdBy: string | null;
            })[];
            id: string;
            status: import(".prisma/client").$Enums.laundry_status;
            createdAt: Date;
            updatedAt: Date;
            urgency_fee: import("@prisma/client/runtime/library").Decimal | null;
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
            ratingAvg: import("@prisma/client/runtime/library").Decimal | null;
            ratingCount: number | null;
            tax_enabled: boolean;
            tax_rate: import("@prisma/client/runtime/library").Decimal | null;
            urgency_enabled: boolean;
            billing_type: import(".prisma/client").$Enums.billing_type;
            commission_rate: import("@prisma/client/runtime/library").Decimal | null;
            trial_commission_ends_at: Date | null;
            balance: import("@prisma/client/runtime/library").Decimal;
            debt_limit: import("@prisma/client/runtime/library").Decimal | null;
        };
    }>;
    updateLaundryOwnerAccount(id: string, dto: {
        email?: string;
        password?: string;
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            fullName: string;
            email: string;
            passwordChanged: boolean;
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
    toggleLaundryDevice(id: string, deviceId: string, isActive: boolean): Promise<{
        success: boolean;
        data: {
            deviceId: string;
            isActive: boolean;
        };
    }>;
    deleteLaundry(req: any, id: string, password?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getUsers(dto: QueryAdminUsersDto): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            _count: {
                userDevices: number;
            };
            phoneNumber: string;
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
            createdAt: Date;
            updatedAt: Date;
            phoneNumber: string | null;
            country: string | null;
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
    toggleUserDevice(id: string, deviceId: string, isActive: boolean): Promise<{
        success: boolean;
        data: {
            deviceId: string;
            isActive: boolean;
        };
    }>;
    deleteUser(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    addLaundryBalance(req: any, id: string, dto: RechargeBalanceDto): Promise<{
        success: boolean;
        message: string;
        data: {
            laundryId: string;
            laundryName: string;
            balanceBefore: number;
            balanceAfter: number;
            amount: number;
            payment_method: "cash" | "electronic" | "bank_transfer" | "cheque" | "other";
            reference_number: string;
            notes: string;
        };
    }>;
    getLaundryBalanceHistory(id: string, limit?: number, offset?: number): Promise<{
        success: boolean;
        data: {
            laundryId: string;
            laundryName: string;
            currentBalance: number;
            totalRecharged: number;
            total: number;
            records: {
                id: any;
                amount: number;
                balanceBefore: number;
                balanceAfter: number;
                paymentMethod: any;
                referenceNumber: any;
                notes: any;
                adminName: any;
                createdAt: any;
            }[];
        };
    }>;
    getAllRecharges(laundryId?: string, search?: string, limit?: number, offset?: number): Promise<{
        success: boolean;
        data: {
            total: number;
            totalRechargedSum: number;
            records: {
                id: any;
                laundryId: any;
                laundryName: any;
                laundryPhone: any;
                amount: number;
                balanceBefore: number;
                balanceAfter: number;
                paymentMethod: any;
                referenceNumber: any;
                notes: any;
                adminName: any;
                createdAt: any;
            }[];
        };
    }>;
}
