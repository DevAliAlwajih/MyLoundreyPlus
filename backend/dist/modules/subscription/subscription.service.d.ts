import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
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
            paymentMethod: string | null;
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
            paymentMethod: string | null;
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
            paymentMethod: string | null;
        };
    }>;
    renewSubscription(id: string, adminId: string): Promise<{
        success: boolean;
        data: {
            amountPaid: number;
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
            paymentMethod: string | null;
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
                name: string;
                phoneNumber: string;
            };
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
            paymentMethod: string | null;
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
            paymentMethod: string | null;
        }[];
    }>;
}
