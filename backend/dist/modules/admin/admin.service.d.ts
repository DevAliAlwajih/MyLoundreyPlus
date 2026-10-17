import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { QueryAdminLaundriesDto, QueryAdminUsersDto } from './dto/query-admin.dto';
import { UpdateLaundryStatusDto } from './dto/update-laundry-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateLaundryDto } from '../laundry/dto/update-laundry.dto';
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
                amountPaid: import("@prisma/client/runtime/library").Decimal;
                laundryId: string;
                notes: string | null;
                planId: string;
                paymentMethod: string | null;
                promoCode: string | null;
                startDate: Date;
                endDate: Date;
                createdBy: string | null;
            })[];
            _count: {
                invoices: number;
                ratings: number;
            };
        } & {
            id: string;
            name: string;
            status: import(".prisma/client").$Enums.laundry_status;
            ownerId: string;
            nameAr: string | null;
            phoneNumber: string;
            address: string | null;
            city: string | null;
            country: string | null;
            currency: string;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
            workingHours: import("@prisma/client/runtime/library").JsonValue | null;
            logoUrl: string | null;
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
                amountPaid: import("@prisma/client/runtime/library").Decimal;
                laundryId: string;
                notes: string | null;
                planId: string;
                paymentMethod: string | null;
                promoCode: string | null;
                startDate: Date;
                endDate: Date;
                createdBy: string | null;
            })[];
            _count: {
                invoices: number;
                promotions: number;
                ratings: number;
            };
            id: string;
            name: string;
            status: import(".prisma/client").$Enums.laundry_status;
            ownerId: string;
            nameAr: string | null;
            phoneNumber: string;
            address: string | null;
            city: string | null;
            country: string | null;
            currency: string;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
            workingHours: import("@prisma/client/runtime/library").JsonValue | null;
            logoUrl: string | null;
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
    updateLaundryDetails(laundryId: string, dto: UpdateLaundryDto): Promise<{
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
                amountPaid: import("@prisma/client/runtime/library").Decimal;
                laundryId: string;
                notes: string | null;
                planId: string;
                paymentMethod: string | null;
                promoCode: string | null;
                startDate: Date;
                endDate: Date;
                createdBy: string | null;
            })[];
            _count: {
                invoices: number;
                promotions: number;
                ratings: number;
            };
            id: string;
            name: string;
            status: import(".prisma/client").$Enums.laundry_status;
            ownerId: string;
            nameAr: string | null;
            phoneNumber: string;
            address: string | null;
            city: string | null;
            country: string | null;
            currency: string;
            latitude: import("@prisma/client/runtime/library").Decimal | null;
            longitude: import("@prisma/client/runtime/library").Decimal | null;
            workingHours: import("@prisma/client/runtime/library").JsonValue | null;
            logoUrl: string | null;
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
    updateLaundryCurrency(laundryId: string, currency: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            name: string;
            country: string;
            currency: string;
        };
    }>;
    updateLaundryOwnerAccount(laundryId: string, dto: {
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
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            lastLoginAt: Date | null;
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
            country: string;
            currency: string;
            createdAt: Date;
            _count: {
                invoices: number;
                userDevices: number;
            };
            fullName: string;
            uniqueId: string;
            role: import(".prisma/client").$Enums.user_role;
            isActive: boolean;
            lastLoginAt: Date;
            email: string;
            userDevices: {
                id: string;
                isActive: boolean;
                lastLoginAt: Date;
                deviceType: string;
                deviceOs: string;
                deviceModel: string;
                isPrimary: boolean;
            }[];
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
            currency: string | null;
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
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            lastLoginAt: Date | null;
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
    getDashboardStats(currency?: string): Promise<{
        success: boolean;
        data: {
            revenue: number;
            commission_revenue: number;
            subscription_revenue: number;
            currency: string;
            counts: {
                total_laundries: number;
                active_laundries: number;
                trial_laundries: number;
                pending_laundries: number;
                total_customers: number;
                today_invoices: number;
                total_invoices: number;
            };
            laundryStatusDistribution: {
                status: import(".prisma/client").$Enums.laundry_status;
                count: number;
            }[];
            chartData: any[];
            recentInvoices: {
                invoice_number: string;
                laundry_name: string;
                currency: string;
                total_amount: number;
                status: import(".prisma/client").$Enums.invoice_status;
                created_at: Date;
            }[];
            currenciesBreakdown: {
                currency: string;
                country: string;
                count: number;
            }[];
            alerts: {
                expiring_soon: number;
                pending_laundries: number;
                open_tickets: number;
            };
        };
    }>;
    getSettings(): Promise<{
        success: boolean;
        data: Record<string, any>;
    }>;
    updateSetting(key: string, value: string, adminId: string): Promise<{
        success: boolean;
        data: {
            description: string | null;
            key: string;
            value: string;
            updated_by: string | null;
            updated_at: Date;
        };
    }>;
    addBalance(laundryId: string, adminId: string, dto: {
        amount: number;
        payment_method?: 'cash' | 'bank_transfer' | 'cheque' | 'electronic' | 'other';
        reference_number?: string;
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            laundryId: string;
            laundryName: string;
            currency: string;
            balanceBefore: number;
            balanceAfter: number;
            amount: number;
            payment_method: "cash" | "electronic" | "bank_transfer" | "cheque" | "other";
            reference_number: string;
            notes: string;
        };
    }>;
    getBalanceHistory(laundryId: string, query?: {
        limit?: number;
        offset?: number;
    }): Promise<{
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
    getAllRecharges(query?: {
        laundryId?: string;
        limit?: number;
        offset?: number;
        search?: string;
    }): Promise<{
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
