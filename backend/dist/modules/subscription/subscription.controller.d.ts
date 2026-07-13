import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
export declare class SubscriptionController {
    private readonly subscriptionService;
    constructor(subscriptionService: SubscriptionService);
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
    private getLaundryId;
    getMySubscription(req: any): Promise<{
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
                nameAr: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
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
            createdAt: Date;
            laundryId: string;
            isActive: boolean;
            notes: string | null;
            promoCode: string | null;
            planId: string;
            paymentMethod: string | null;
            startDate: Date;
            endDate: Date;
            createdBy: string | null;
        };
        message?: undefined;
    }>;
    getMySubscriptionHistory(req: any): Promise<{
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
            createdAt: Date;
            laundryId: string;
            isActive: boolean;
            notes: string | null;
            promoCode: string | null;
            planId: string;
            paymentMethod: string | null;
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
            createdAt: Date;
            laundryId: string;
            isActive: boolean;
            notes: string | null;
            promoCode: string | null;
            planId: string;
            paymentMethod: string | null;
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
            id: string;
            createdAt: Date;
            laundryId: string;
            isActive: boolean;
            notes: string | null;
            promoCode: string | null;
            planId: string;
            paymentMethod: string | null;
            startDate: Date;
            endDate: Date;
            createdBy: string | null;
        }[];
    }>;
    createSubscription(req: any, dto: CreateSubscriptionDto): Promise<{
        success: boolean;
        data: {
            amountPaid: number;
            plan: {
                priceSar: number;
                id: string;
                nameAr: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
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
            createdAt: Date;
            laundryId: string;
            isActive: boolean;
            notes: string | null;
            promoCode: string | null;
            planId: string;
            paymentMethod: string | null;
            startDate: Date;
            endDate: Date;
            createdBy: string | null;
        };
    }>;
    renewSubscription(req: any, id: string): Promise<{
        success: boolean;
        data: {
            amountPaid: number;
            id: string;
            createdAt: Date;
            laundryId: string;
            isActive: boolean;
            notes: string | null;
            promoCode: string | null;
            planId: string;
            paymentMethod: string | null;
            startDate: Date;
            endDate: Date;
            createdBy: string | null;
        };
    }>;
    deactivateSubscription(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
