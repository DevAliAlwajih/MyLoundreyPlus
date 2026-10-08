import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from './dto/promo-code.dto';
export declare class SubscriptionService {
    private readonly prisma;
    private readonly notificationService;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    getPlans(): Promise<{
        success: boolean;
        data: {
            id: string;
            nameAr: string;
            nameEn: string;
            durationDays: number;
            originalPrice: number;
            finalPrice: number;
            features: import("@prisma/client/runtime/library").JsonValue;
            isSeasonal: boolean;
            occasionName: string;
            discountPercent: number;
            isOfferActive: boolean;
        }[];
    }>;
    getPlanById(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            nameAr: string;
            nameEn: string;
            durationDays: number;
            originalPrice: number;
            finalPrice: number;
            features: import("@prisma/client/runtime/library").JsonValue;
            isSeasonal: boolean;
            occasionName: string;
            discountPercent: number;
            isOfferActive: boolean;
        };
    }>;
    getMySubscription(laundryId: string): Promise<{
        success: boolean;
        data: any;
        message: string;
    } | {
        success: boolean;
        data: {
            amountPaid: number;
            plan: {
                priceSar: number;
                discount_percent: number;
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                nameAr: string;
                nameEn: string;
                durationDays: number;
                features: import("@prisma/client/runtime/library").JsonValue | null;
                is_seasonal: boolean;
                occasion_name: string | null;
                offer_valid_from: Date | null;
                offer_valid_until: Date | null;
            };
            daysRemaining: number;
            isExpiringSoon: boolean;
            isExpired: boolean;
            promoCode: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            laundryId: string;
            notes: string | null;
            paymentMethod: string | null;
            planId: string;
            startDate: Date;
            endDate: Date;
            createdBy: string | null;
        };
        message?: undefined;
    }>;
    getMySubscriptionHistory(laundryId: string): Promise<{
        success: boolean;
        data: {
            amountPaid: number;
            plan: {
                id: string;
                nameAr: string;
                nameEn: string;
                durationDays: number;
            };
            promoCode: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            laundryId: string;
            notes: string | null;
            paymentMethod: string | null;
            planId: string;
            startDate: Date;
            endDate: Date;
            createdBy: string | null;
        }[];
    }>;
    validatePromoCode(code: string, planId: string): Promise<{
        success: boolean;
        data: {
            code: string;
            discountType: string;
            discountValue: number;
            originalPrice: number;
            discount: number;
            finalPrice: number;
        };
    }>;
    createSubscription(adminId: string, dto: CreateSubscriptionDto): Promise<{
        success: boolean;
        data: {
            amountPaid: number;
            plan: {
                priceSar: number;
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                nameAr: string;
                nameEn: string;
                durationDays: number;
                features: import("@prisma/client/runtime/library").JsonValue | null;
                is_seasonal: boolean;
                occasion_name: string | null;
                discount_percent: import("@prisma/client/runtime/library").Decimal | null;
                offer_valid_from: Date | null;
                offer_valid_until: Date | null;
            };
            promoCode: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            laundryId: string;
            notes: string | null;
            paymentMethod: string | null;
            planId: string;
            startDate: Date;
            endDate: Date;
            createdBy: string | null;
        };
    }>;
    renewSubscription(id: string, adminId: string): Promise<{
        success: boolean;
        data: {
            amountPaid: number;
            promoCode: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            laundryId: string;
            notes: string | null;
            paymentMethod: string | null;
            planId: string;
            startDate: Date;
            endDate: Date;
            createdBy: string | null;
        };
    }>;
    deactivateSubscription(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getExpiring(): Promise<{
        success: boolean;
        data: unknown;
        fallback?: undefined;
    } | {
        success: boolean;
        data: {
            amountPaid: number;
            laundry: {
                id: string;
                phoneNumber: string;
                name: string;
            };
            promoCode: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            laundryId: string;
            notes: string | null;
            paymentMethod: string | null;
            planId: string;
            startDate: Date;
            endDate: Date;
            createdBy: string | null;
        }[];
        fallback: boolean;
    }>;
    getAllSubscriptions(): Promise<{
        success: boolean;
        data: {
            amountPaid: number;
            laundry: {
                id: string;
                name: string;
            };
            plan: {
                nameAr: string;
                nameEn: string;
                durationDays: number;
            };
            promoCode: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            laundryId: string;
            notes: string | null;
            paymentMethod: string | null;
            planId: string;
            startDate: Date;
            endDate: Date;
            createdBy: string | null;
        }[];
    }>;
    adminGetAllPlans(): Promise<{
        success: boolean;
        data: {
            id: string;
            nameAr: string;
            nameEn: string;
            durationDays: number;
            priceSar: number;
            features: any;
            isActive: boolean;
            isSeasonal: boolean;
            occasionName: string;
            discountPercent: number;
            offerValidFrom: string;
            offerValidUntil: string;
            createdAt: Date;
        }[];
    }>;
    adminCreatePlan(dto: CreatePlanDto): Promise<{
        success: boolean;
        message: string;
        data: {
            priceSar: number;
            discountPercent: number;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            nameAr: string;
            nameEn: string;
            durationDays: number;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            is_seasonal: boolean;
            occasion_name: string | null;
            discount_percent: import("@prisma/client/runtime/library").Decimal | null;
            offer_valid_from: Date | null;
            offer_valid_until: Date | null;
        };
    }>;
    adminUpdatePlan(id: string, dto: UpdatePlanDto): Promise<{
        success: boolean;
        message: string;
        data: {
            priceSar: number;
            discountPercent: number;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            nameAr: string;
            nameEn: string;
            durationDays: number;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            is_seasonal: boolean;
            occasion_name: string | null;
            discount_percent: import("@prisma/client/runtime/library").Decimal | null;
            offer_valid_from: Date | null;
            offer_valid_until: Date | null;
        };
    }>;
    adminDeletePlan(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    adminGetAllPromoCodes(): Promise<{
        success: boolean;
        data: {
            id: string;
            code: string;
            description: string;
            discountType: string;
            discountValue: number;
            maxUses: number;
            usedCount: number;
            validFrom: string;
            validUntil: string;
            isActive: boolean;
            createdAt: Date;
            creatorName: string;
        }[];
    }>;
    adminCreatePromoCode(adminId: string, dto: CreatePromoCodeDto): Promise<{
        success: boolean;
        message: string;
        data: {
            discountValue: number;
            id: string;
            isActive: boolean;
            createdAt: Date;
            description: string | null;
            createdBy: string | null;
            code: string;
            discountType: string;
            maxUses: number | null;
            usedCount: number;
            validFrom: Date | null;
            validUntil: Date | null;
        };
    }>;
    adminUpdatePromoCode(id: string, dto: UpdatePromoCodeDto): Promise<{
        success: boolean;
        message: string;
        data: {
            discountValue: number;
            id: string;
            isActive: boolean;
            createdAt: Date;
            description: string | null;
            createdBy: string | null;
            code: string;
            discountType: string;
            maxUses: number | null;
            usedCount: number;
            validFrom: Date | null;
            validUntil: Date | null;
        };
    }>;
    adminDeletePromoCode(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getCommissionSettings(): Promise<{
        success: boolean;
        data: {
            defaultCommissionRate: number;
            defaultTrialDays: number;
            defaultInitialBalance: number;
            defaultDebtLimit: number;
            minRechargeAmount: number;
        };
    }>;
    updateCommissionSettings(adminId: string, data: {
        defaultCommissionRate?: number;
        defaultTrialDays?: number;
        defaultInitialBalance?: number;
        defaultDebtLimit?: number;
        minRechargeAmount?: number;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getCommissionTransactions(query?: {
        laundryId?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        success: boolean;
        data: {
            transactions: {
                id: string;
                laundryId: string;
                laundryName: string;
                laundryPhone: string;
                currentBalance: number;
                invoiceId: string;
                invoiceNumber: string;
                invoiceTotal: number;
                commissionRate: number;
                commissionAmount: number;
                balanceAfter: number;
                type: import(".prisma/client").$Enums.transaction_type;
                createdAt: Date;
            }[];
            total: number;
            totalCommissionSum: number;
            totalInvoicesSum: number;
        };
    }>;
}
