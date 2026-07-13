"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
let SubscriptionService = class SubscriptionService {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
    }
    async getPlans() {
        const today = new Date();
        const plans = await this.prisma.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { priceSar: 'asc' },
        });
        return {
            success: true,
            data: plans.map((plan) => {
                let finalPrice = Number(plan.priceSar);
                let isOfferActive = false;
                if (plan.is_seasonal && plan.discount_percent) {
                    const validFrom = plan.offer_valid_from ? new Date(plan.offer_valid_from) : null;
                    const validUntil = plan.offer_valid_until ? new Date(plan.offer_valid_until) : null;
                    if ((!validFrom || today >= validFrom) && (!validUntil || today <= validUntil)) {
                        finalPrice = finalPrice * (1 - Number(plan.discount_percent) / 100);
                        isOfferActive = true;
                    }
                }
                return {
                    id: plan.id,
                    nameAr: plan.nameAr,
                    nameEn: plan.nameEn,
                    durationDays: plan.durationDays,
                    originalPrice: Number(plan.priceSar),
                    finalPrice: Math.round(finalPrice * 100) / 100,
                    features: plan.features,
                    isSeasonal: plan.is_seasonal,
                    occasionName: plan.occasion_name,
                    discountPercent: plan.discount_percent !== null ? Number(plan.discount_percent) : null,
                    isOfferActive,
                };
            }),
        };
    }
    async getPlanById(id) {
        const plan = await this.prisma.subscriptionPlan.findUnique({
            where: { id },
        });
        if (!plan) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'PLAN_NOT_FOUND', message: 'خطة الاشتراك غير موجودة' },
            });
        }
        const today = new Date();
        let finalPrice = Number(plan.priceSar);
        let isOfferActive = false;
        if (plan.is_seasonal && plan.discount_percent) {
            const validFrom = plan.offer_valid_from ? new Date(plan.offer_valid_from) : null;
            const validUntil = plan.offer_valid_until ? new Date(plan.offer_valid_until) : null;
            if ((!validFrom || today >= validFrom) && (!validUntil || today <= validUntil)) {
                finalPrice = finalPrice * (1 - Number(plan.discount_percent) / 100);
                isOfferActive = true;
            }
        }
        return {
            success: true,
            data: {
                id: plan.id,
                nameAr: plan.nameAr,
                nameEn: plan.nameEn,
                durationDays: plan.durationDays,
                originalPrice: Number(plan.priceSar),
                finalPrice: Math.round(finalPrice * 100) / 100,
                features: plan.features,
                isSeasonal: plan.is_seasonal,
                occasionName: plan.occasion_name,
                discountPercent: plan.discount_percent !== null ? Number(plan.discount_percent) : null,
                isOfferActive,
            },
        };
    }
    async getMySubscription(laundryId) {
        const subscription = await this.prisma.subscription.findFirst({
            where: { laundryId, isActive: true },
            orderBy: { createdAt: 'desc' },
            include: { plan: true },
        });
        if (!subscription) {
            return {
                success: true,
                data: null,
                message: 'لا يوجد اشتراك فعّال',
            };
        }
        const today = new Date();
        const daysRemaining = Math.ceil((new Date(subscription.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
            success: true,
            data: {
                ...subscription,
                amountPaid: Number(subscription.amountPaid),
                plan: {
                    ...subscription.plan,
                    priceSar: Number(subscription.plan.priceSar),
                    discount_percent: subscription.plan.discount_percent !== null
                        ? Number(subscription.plan.discount_percent)
                        : null,
                },
                daysRemaining,
                isExpiringSoon: daysRemaining <= 7,
                isExpired: daysRemaining <= 0,
            },
        };
    }
    async getMySubscriptionHistory(laundryId) {
        const history = await this.prisma.subscription.findMany({
            where: { laundryId },
            orderBy: { createdAt: 'desc' },
            include: {
                plan: { select: { id: true, nameAr: true, nameEn: true, durationDays: true } },
            },
        });
        return {
            success: true,
            data: history.map((sub) => ({
                ...sub,
                amountPaid: Number(sub.amountPaid),
            })),
        };
    }
    async validatePromoCode(code, planId) {
        const promo = await this.prisma.promoCode.findUnique({
            where: { code: code.toUpperCase() },
        });
        if (!promo || !promo.isActive) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'PROMO_NOT_FOUND', message: 'كود الخصم غير صالح' },
            });
        }
        const today = new Date();
        if (promo.validFrom && today < new Date(promo.validFrom)) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'PROMO_NOT_STARTED', message: 'كود الخصم لم يبدأ بعد' },
            });
        }
        if (promo.validUntil && today > new Date(promo.validUntil)) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'PROMO_EXPIRED', message: 'انتهت صلاحية كود الخصم' },
            });
        }
        if (promo.maxUses && promo.usedCount >= promo.maxUses) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'PROMO_EXHAUSTED', message: 'تم استنفاد هذا الكود' },
            });
        }
        const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        if (!plan) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'PLAN_NOT_FOUND', message: 'الخطة غير موجودة' },
            });
        }
        const originalPrice = Number(plan.priceSar);
        let discount = 0;
        if (promo.discountType === 'percent') {
            discount = originalPrice * (Number(promo.discountValue) / 100);
        }
        else {
            discount = Math.min(Number(promo.discountValue), originalPrice);
        }
        const finalPrice = Math.max(0, originalPrice - discount);
        return {
            success: true,
            data: {
                code: promo.code,
                discountType: promo.discountType,
                discountValue: Number(promo.discountValue),
                originalPrice,
                discount: Math.round(discount * 100) / 100,
                finalPrice: Math.round(finalPrice * 100) / 100,
            },
        };
    }
    async createSubscription(adminId, dto) {
        const plan = await this.prisma.subscriptionPlan.findUnique({
            where: { id: dto.planId, isActive: true },
        });
        if (!plan) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'PLAN_NOT_FOUND', message: 'الخطة غير موجودة أو غير فعّالة' },
            });
        }
        let amountPaid = Number(plan.priceSar);
        if (dto.promoCode) {
            const promo = await this.prisma.promoCode.findUnique({
                where: { code: dto.promoCode.toUpperCase(), isActive: true },
            });
            if (promo) {
                const discount = promo.discountType === 'percent'
                    ? amountPaid * (Number(promo.discountValue) / 100)
                    : Number(promo.discountValue);
                amountPaid = Math.max(0, amountPaid - discount);
                await this.prisma.promoCode.update({
                    where: { id: promo.id },
                    data: { usedCount: { increment: 1 } },
                });
            }
        }
        try {
            const subscription = await this.prisma.$transaction(async (tx) => {
                await tx.subscription.updateMany({
                    where: { laundryId: dto.laundryId, isActive: true },
                    data: { isActive: false },
                });
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + plan.durationDays);
                const sub = await tx.subscription.create({
                    data: {
                        laundry: { connect: { id: dto.laundryId } },
                        plan: { connect: { id: dto.planId } },
                        amountPaid,
                        paymentMethod: dto.paymentMethod ?? 'manual',
                        promoCode: dto.promoCode,
                        startDate,
                        endDate,
                        isActive: true,
                        notes: dto.notes,
                        creator: { connect: { id: adminId } },
                    },
                    include: { plan: true },
                });
                await tx.laundry.update({
                    where: { id: dto.laundryId },
                    data: { status: 'active' },
                });
                return sub;
            });
            this.notificationService
                .sendToLaundryOwner(dto.laundryId, 'تم تفعيل اشتراكك 🎉', `خطة ${plan.nameAr} — تنتهي في ${subscription.endDate.toLocaleDateString('ar-SA')}`, { type: 'subscription_activated', referenceId: subscription.id })
                .catch((err) => console.error('Notification error:', err));
            return {
                success: true,
                data: {
                    ...subscription,
                    amountPaid: Number(subscription.amountPaid),
                    plan: {
                        ...plan,
                        priceSar: Number(plan.priceSar),
                    },
                },
            };
        }
        catch (error) {
            console.error(error);
            throw new common_1.InternalServerErrorException({
                success: false,
                error: { code: 'SUBSCRIPTION_FAILED', message: 'حدث خطأ أثناء إنشاء الاشتراك' },
            });
        }
    }
    async renewSubscription(id, adminId) {
        const existing = await this.prisma.subscription.findUnique({
            where: { id },
            include: { plan: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'SUBSCRIPTION_NOT_FOUND', message: 'الاشتراك غير موجود' },
            });
        }
        const startDate = new Date(existing.endDate);
        if (startDate < new Date()) {
            startDate.setTime(new Date().getTime());
        }
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + existing.plan.durationDays);
        const renewed = await this.prisma.$transaction(async (tx) => {
            await tx.subscription.update({
                where: { id },
                data: { isActive: false },
            });
            return tx.subscription.create({
                data: {
                    laundry: { connect: { id: existing.laundryId } },
                    plan: { connect: { id: existing.planId } },
                    amountPaid: existing.plan.priceSar,
                    paymentMethod: 'manual',
                    startDate,
                    endDate,
                    isActive: true,
                    creator: { connect: { id: adminId } },
                },
            });
        });
        return {
            success: true,
            data: {
                ...renewed,
                amountPaid: Number(renewed.amountPaid),
            },
        };
    }
    async deactivateSubscription(id) {
        const subscription = await this.prisma.subscription.update({
            where: { id },
            data: { isActive: false },
        });
        await this.prisma.laundry.update({
            where: { id: subscription.laundryId },
            data: { status: 'suspended' },
        });
        return { success: true, message: 'تم إيقاف الاشتراك بنجاح' };
    }
    async getExpiring() {
        try {
            const result = await this.prisma.$queryRaw `SELECT * FROM v_expiring_subscriptions`;
            return { success: true, data: result };
        }
        catch (error) {
            console.error('View error:', error);
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const result = await this.prisma.subscription.findMany({
                where: {
                    isActive: true,
                    endDate: { lte: nextWeek },
                },
                include: { laundry: { select: { id: true, name: true, phoneNumber: true } } },
            });
            return {
                success: true,
                data: result.map((r) => ({
                    ...r,
                    amountPaid: Number(r.amountPaid),
                })),
                fallback: true,
            };
        }
    }
    async getAllSubscriptions() {
        const subscriptions = await this.prisma.subscription.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                laundry: { select: { id: true, name: true } },
                plan: { select: { nameAr: true, nameEn: true, durationDays: true } },
            },
        });
        return {
            success: true,
            data: subscriptions.map((s) => ({ ...s, amountPaid: Number(s.amountPaid) })),
        };
    }
};
exports.SubscriptionService = SubscriptionService;
exports.SubscriptionService = SubscriptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], SubscriptionService);
//# sourceMappingURL=subscription.service.js.map