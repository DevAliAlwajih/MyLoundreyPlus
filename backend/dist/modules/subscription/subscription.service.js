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
    async adminGetAllPlans() {
        const plans = await this.prisma.subscriptionPlan.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return {
            success: true,
            data: plans.map((p) => ({
                id: p.id,
                nameAr: p.nameAr,
                nameEn: p.nameEn,
                durationDays: p.durationDays,
                priceSar: Number(p.priceSar),
                features: Array.isArray(p.features) ? p.features : typeof p.features === 'string' ? JSON.parse(p.features) : p.features || [],
                isActive: p.isActive,
                isSeasonal: p.is_seasonal,
                occasionName: p.occasion_name,
                discountPercent: p.discount_percent !== null ? Number(p.discount_percent) : 0,
                offerValidFrom: p.offer_valid_from ? p.offer_valid_from.toISOString().split('T')[0] : null,
                offerValidUntil: p.offer_valid_until ? p.offer_valid_until.toISOString().split('T')[0] : null,
                createdAt: p.createdAt,
            })),
        };
    }
    async adminCreatePlan(dto) {
        const plan = await this.prisma.subscriptionPlan.create({
            data: {
                nameAr: dto.nameAr,
                nameEn: dto.nameEn,
                durationDays: dto.durationDays,
                priceSar: dto.priceSar,
                features: dto.features ?? [],
                isActive: dto.isActive ?? true,
                is_seasonal: dto.isSeasonal ?? false,
                occasion_name: dto.occasionName ?? null,
                discount_percent: dto.discountPercent ?? 0,
                offer_valid_from: dto.offerValidFrom ? new Date(dto.offerValidFrom) : null,
                offer_valid_until: dto.offerValidUntil ? new Date(dto.offerValidUntil) : null,
            },
        });
        return {
            success: true,
            message: 'تم إنشاء الباقة بنجاح',
            data: {
                ...plan,
                priceSar: Number(plan.priceSar),
                discountPercent: plan.discount_percent !== null ? Number(plan.discount_percent) : 0,
            },
        };
    }
    async adminUpdatePlan(id, dto) {
        const existing = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException({ success: false, error: { message: 'الباقة غير موجودة' } });
        }
        const data = {};
        if (dto.nameAr !== undefined)
            data.nameAr = dto.nameAr;
        if (dto.nameEn !== undefined)
            data.nameEn = dto.nameEn;
        if (dto.durationDays !== undefined)
            data.durationDays = dto.durationDays;
        if (dto.priceSar !== undefined)
            data.priceSar = dto.priceSar;
        if (dto.features !== undefined)
            data.features = dto.features;
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        if (dto.isSeasonal !== undefined)
            data.is_seasonal = dto.isSeasonal;
        if (dto.occasionName !== undefined)
            data.occasion_name = dto.occasionName;
        if (dto.discountPercent !== undefined)
            data.discount_percent = dto.discountPercent;
        if (dto.offerValidFrom !== undefined)
            data.offer_valid_from = dto.offerValidFrom ? new Date(dto.offerValidFrom) : null;
        if (dto.offerValidUntil !== undefined)
            data.offer_valid_until = dto.offerValidUntil ? new Date(dto.offerValidUntil) : null;
        const updated = await this.prisma.subscriptionPlan.update({
            where: { id },
            data,
        });
        return {
            success: true,
            message: 'تم تحديث الباقة بنجاح',
            data: {
                ...updated,
                priceSar: Number(updated.priceSar),
                discountPercent: updated.discount_percent !== null ? Number(updated.discount_percent) : 0,
            },
        };
    }
    async adminDeletePlan(id) {
        const activeSubsCount = await this.prisma.subscription.count({
            where: { planId: id, isActive: true },
        });
        if (activeSubsCount > 0) {
            await this.prisma.subscriptionPlan.update({
                where: { id },
                data: { isActive: false },
            });
            return {
                success: true,
                message: 'تم تعطيل الباقة نظراً لوجود اشتراكات نشطة مرتبطة بها',
            };
        }
        try {
            await this.prisma.subscriptionPlan.delete({ where: { id } });
            return { success: true, message: 'تم حذف الباقة بنجاح' };
        }
        catch {
            await this.prisma.subscriptionPlan.update({
                where: { id },
                data: { isActive: false },
            });
            return { success: true, message: 'تم تعطيل الباقة بنجاح' };
        }
    }
    async adminGetAllPromoCodes() {
        const codes = await this.prisma.promoCode.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                creator: { select: { id: true, fullName: true } },
            },
        });
        return {
            success: true,
            data: codes.map((c) => ({
                id: c.id,
                code: c.code,
                description: c.description,
                discountType: c.discountType,
                discountValue: Number(c.discountValue),
                maxUses: c.maxUses,
                usedCount: c.usedCount,
                validFrom: c.validFrom ? c.validFrom.toISOString().split('T')[0] : null,
                validUntil: c.validUntil ? c.validUntil.toISOString().split('T')[0] : null,
                isActive: c.isActive,
                createdAt: c.createdAt,
                creatorName: c.creator?.fullName,
            })),
        };
    }
    async adminCreatePromoCode(adminId, dto) {
        const existing = await this.prisma.promoCode.findUnique({
            where: { code: dto.code.toUpperCase() },
        });
        if (existing) {
            throw new common_1.BadRequestException({ success: false, error: { message: 'كود الخصم مستخدم مسبقاً' } });
        }
        const promo = await this.prisma.promoCode.create({
            data: {
                code: dto.code.toUpperCase(),
                description: dto.description,
                discountType: dto.discountType,
                discountValue: dto.discountValue,
                maxUses: dto.maxUses,
                validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
                validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
                isActive: dto.isActive ?? true,
                createdBy: adminId,
            },
        });
        return {
            success: true,
            message: 'تم إنشاء كود الخصم بنجاح',
            data: {
                ...promo,
                discountValue: Number(promo.discountValue),
            },
        };
    }
    async adminUpdatePromoCode(id, dto) {
        const existing = await this.prisma.promoCode.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException({ success: false, error: { message: 'كود الخصم غير موجود' } });
        }
        const data = {};
        if (dto.code !== undefined)
            data.code = dto.code.toUpperCase();
        if (dto.description !== undefined)
            data.description = dto.description;
        if (dto.discountType !== undefined)
            data.discountType = dto.discountType;
        if (dto.discountValue !== undefined)
            data.discountValue = dto.discountValue;
        if (dto.maxUses !== undefined)
            data.maxUses = dto.maxUses;
        if (dto.validFrom !== undefined)
            data.validFrom = dto.validFrom ? new Date(dto.validFrom) : null;
        if (dto.validUntil !== undefined)
            data.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        const updated = await this.prisma.promoCode.update({
            where: { id },
            data,
        });
        return {
            success: true,
            message: 'تم تحديث كود الخصم بنجاح',
            data: {
                ...updated,
                discountValue: Number(updated.discountValue),
            },
        };
    }
    async adminDeletePromoCode(id) {
        await this.prisma.promoCode.delete({ where: { id } });
        return { success: true, message: 'تم حذف كود الخصم بنجاح' };
    }
    async getCommissionSettings() {
        const settings = await this.prisma.app_settings.findMany({
            where: {
                key: {
                    in: ['default_commission_rate', 'default_trial_days', 'default_debt_limit', 'min_recharge_amount'],
                },
            },
        });
        const map = {};
        settings.forEach((s) => {
            map[s.key] = s.value;
        });
        return {
            success: true,
            data: {
                defaultCommissionRate: map['default_commission_rate'] ? Number(map['default_commission_rate']) : 10,
                defaultTrialDays: map['default_trial_days'] ? Number(map['default_trial_days']) : 30,
                defaultDebtLimit: map['default_debt_limit'] ? Number(map['default_debt_limit']) : 500,
                minRechargeAmount: map['min_recharge_amount'] ? Number(map['min_recharge_amount']) : 100,
            },
        };
    }
    async updateCommissionSettings(adminId, data) {
        const updates = [];
        if (data.defaultCommissionRate !== undefined) {
            updates.push(this.prisma.app_settings.upsert({
                where: { key: 'default_commission_rate' },
                update: { value: String(data.defaultCommissionRate), updated_by: adminId, updated_at: new Date() },
                create: { key: 'default_commission_rate', value: String(data.defaultCommissionRate), description: 'Default commission rate %', updated_by: adminId },
            }));
        }
        if (data.defaultTrialDays !== undefined) {
            updates.push(this.prisma.app_settings.upsert({
                where: { key: 'default_trial_days' },
                update: { value: String(data.defaultTrialDays), updated_by: adminId, updated_at: new Date() },
                create: { key: 'default_trial_days', value: String(data.defaultTrialDays), description: 'Default trial days for new laundries', updated_by: adminId },
            }));
        }
        if (data.defaultDebtLimit !== undefined) {
            updates.push(this.prisma.app_settings.upsert({
                where: { key: 'default_debt_limit' },
                update: { value: String(data.defaultDebtLimit), updated_by: adminId, updated_at: new Date() },
                create: { key: 'default_debt_limit', value: String(data.defaultDebtLimit), description: 'Default debt limit for laundries in SAR', updated_by: adminId },
            }));
        }
        if (data.minRechargeAmount !== undefined) {
            updates.push(this.prisma.app_settings.upsert({
                where: { key: 'min_recharge_amount' },
                update: { value: String(data.minRechargeAmount), updated_by: adminId, updated_at: new Date() },
                create: { key: 'min_recharge_amount', value: String(data.minRechargeAmount), description: 'Minimum wallet recharge amount in SAR', updated_by: adminId },
            }));
        }
        await Promise.all(updates);
        return {
            success: true,
            message: 'تم حفظ إعدادات العمولات بنجاح',
        };
    }
    async getCommissionTransactions(query) {
        const limit = query?.limit ? Number(query.limit) : 50;
        const offset = query?.offset ? Number(query.offset) : 0;
        const where = {};
        if (query?.laundryId)
            where.laundry_id = query.laundryId;
        const [transactions, total, stats] = await Promise.all([
            this.prisma.commissionTransaction.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { created_at: 'desc' },
                include: {
                    laundry: { select: { id: true, name: true, nameAr: true, phoneNumber: true, balance: true } },
                    invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, status: true } },
                },
            }),
            this.prisma.commissionTransaction.count({ where }),
            this.prisma.commissionTransaction.aggregate({
                _sum: {
                    commission_amount: true,
                    invoice_total: true,
                },
            }),
        ]);
        return {
            success: true,
            data: {
                transactions: transactions.map((t) => ({
                    id: t.id,
                    laundryId: t.laundry_id,
                    laundryName: t.laundry?.nameAr || t.laundry?.name,
                    laundryPhone: t.laundry?.phoneNumber,
                    currentBalance: Number(t.laundry?.balance ?? 0),
                    invoiceId: t.invoice_id,
                    invoiceNumber: t.invoice?.invoiceNumber,
                    invoiceTotal: Number(t.invoice_total),
                    commissionRate: Number(t.commission_rate),
                    commissionAmount: Number(t.commission_amount),
                    balanceAfter: Number(t.balance_after),
                    type: t.type,
                    createdAt: t.created_at,
                })),
                total,
                totalCommissionSum: Number(stats._sum.commission_amount ?? 0),
                totalInvoicesSum: Number(stats._sum.invoice_total ?? 0),
            },
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