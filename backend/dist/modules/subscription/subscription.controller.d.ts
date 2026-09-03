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
    createSubscription(req: any, dto: CreateSubscriptionDto): Promise<{
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
    renewSubscription(req: any, id: string): Promise<{
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
}
