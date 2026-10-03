import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from './dto/promo-code.dto';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // ────────────────────────────────────────────────────
  // 1. GET /subscriptions/plans — خطط الاشتراك
  // ────────────────────────────────────────────────────
  async getPlans() {
    const today = new Date();
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceSar: 'asc' },
    });

    // احسب السعر الفعلي مع خصم الموسمية
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

  // ────────────────────────────────────────────────────
  // 2. GET /subscriptions/plans/:id — تفاصيل خطة
  // ────────────────────────────────────────────────────
  async getPlanById(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });
    if (!plan) {
      throw new NotFoundException({
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

  // ────────────────────────────────────────────────────
  // 3. GET /subscriptions/my — اشتراكي الحالي
  // ────────────────────────────────────────────────────
  async getMySubscription(laundryId: string) {
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
    const daysRemaining = Math.ceil(
      (new Date(subscription.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      success: true,
      data: {
        ...subscription,
        amountPaid: Number(subscription.amountPaid),
        plan: {
          ...subscription.plan,
          priceSar: Number(subscription.plan.priceSar),
          discount_percent:
            subscription.plan.discount_percent !== null
              ? Number(subscription.plan.discount_percent)
              : null,
        },
        daysRemaining,
        isExpiringSoon: daysRemaining <= 7,
        isExpired: daysRemaining <= 0,
      },
    };
  }

  // ────────────────────────────────────────────────────
  // 4. GET /subscriptions/my/history — تاريخ اشتراكاتي
  // ────────────────────────────────────────────────────
  async getMySubscriptionHistory(laundryId: string) {
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

  // ────────────────────────────────────────────────────
  // 5. POST /subscriptions/validate-promo — التحقق من كود خصم
  // ────────────────────────────────────────────────────
  async validatePromoCode(code: string, planId: string) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo || !promo.isActive) {
      throw new NotFoundException({
        success: false,
        error: { code: 'PROMO_NOT_FOUND', message: 'كود الخصم غير صالح' },
      });
    }

    const today = new Date();
    if (promo.validFrom && today < new Date(promo.validFrom)) {
      throw new BadRequestException({
        success: false,
        error: { code: 'PROMO_NOT_STARTED', message: 'كود الخصم لم يبدأ بعد' },
      });
    }
    if (promo.validUntil && today > new Date(promo.validUntil)) {
      throw new BadRequestException({
        success: false,
        error: { code: 'PROMO_EXPIRED', message: 'انتهت صلاحية كود الخصم' },
      });
    }
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      throw new BadRequestException({
        success: false,
        error: { code: 'PROMO_EXHAUSTED', message: 'تم استنفاد هذا الكود' },
      });
    }

    // احسب الخصم على الخطة
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException({
        success: false,
        error: { code: 'PLAN_NOT_FOUND', message: 'الخطة غير موجودة' },
      });
    }

    const originalPrice = Number(plan.priceSar);
    let discount = 0;

    if (promo.discountType === 'percent') {
      discount = originalPrice * (Number(promo.discountValue) / 100);
    } else {
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

  // ────────────────────────────────────────────────────
  // 6. POST /subscriptions — إنشاء اشتراك (Admin)
  // ────────────────────────────────────────────────────
  async createSubscription(adminId: string, dto: CreateSubscriptionDto) {
    // 1. جلب الخطة
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId, isActive: true },
    });
    if (!plan) {
      throw new NotFoundException({
        success: false,
        error: { code: 'PLAN_NOT_FOUND', message: 'الخطة غير موجودة أو غير فعّالة' },
      });
    }

    // 2. تطبيق كود الخصم إن وُجد
    let amountPaid = Number(plan.priceSar);
    if (dto.promoCode) {
      const promo = await this.prisma.promoCode.findUnique({
        where: { code: dto.promoCode.toUpperCase(), isActive: true },
      });
      if (promo) {
        const discount =
          promo.discountType === 'percent'
            ? amountPaid * (Number(promo.discountValue) / 100)
            : Number(promo.discountValue);
        amountPaid = Math.max(0, amountPaid - discount);

        // تحديث عداد الاستخدام
        await this.prisma.promoCode.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    try {
      const subscription = await this.prisma.$transaction(async (tx) => {
        // 3. إلغاء تفعيل الاشتراك السابق
        await tx.subscription.updateMany({
          where: { laundryId: dto.laundryId, isActive: true },
          data: { isActive: false },
        });

        // 4. حساب تاريخ الانتهاء
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.durationDays);

        // 5. إنشاء الاشتراك
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

        // 6. تفعيل المغسلة
        await tx.laundry.update({
          where: { id: dto.laundryId },
          data: { status: 'active' },
        });

        return sub;
      });

      // 7. إشعار لصاحب المغسلة
      this.notificationService
        .sendToLaundryOwner(
          dto.laundryId,
          'تم تفعيل اشتراكك 🎉',
          `خطة ${plan.nameAr} — تنتهي في ${subscription.endDate.toLocaleDateString('ar-SA')}`,
          { type: 'subscription_activated', referenceId: subscription.id },
        )
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
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({
        success: false,
        error: { code: 'SUBSCRIPTION_FAILED', message: 'حدث خطأ أثناء إنشاء الاشتراك' },
      });
    }
  }

  // ────────────────────────────────────────────────────
  // 7. PATCH /subscriptions/:id/renew — تجديد (Admin)
  // ────────────────────────────────────────────────────
  async renewSubscription(id: string, adminId: string) {
    const existing = await this.prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });
    if (!existing) {
      throw new NotFoundException({
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
          paymentMethod: 'manual', // Default
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

  // ────────────────────────────────────────────────────
  // 8. PATCH /subscriptions/:id/deactivate — إلغاء (Admin)
  // ────────────────────────────────────────────────────
  async deactivateSubscription(id: string) {
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

  // ────────────────────────────────────────────────────
  // 9. GET /subscriptions/expiring — اشتراكات منتهية (Admin)
  // ────────────────────────────────────────────────────
  async getExpiring() {
    try {
      const result = await this.prisma.$queryRaw`SELECT * FROM v_expiring_subscriptions`;
      return { success: true, data: result };
    } catch (error) {
      console.error('View error:', error);
      // Fallback in case the view does not exist yet
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

  // ────────────────────────────────────────────────────
  // 10. GET /subscriptions — كل الاشتراكات (Admin)
  // ────────────────────────────────────────────────────
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

  // ────────────────────────────────────────────────────
  // 🛡️ 11. Admin: Plans & Packages Management (CRUD)
  // ────────────────────────────────────────────────────
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

  async adminCreatePlan(dto: CreatePlanDto) {
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

  async adminUpdatePlan(id: string, dto: UpdatePlanDto) {
    const existing = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ success: false, error: { message: 'الباقة غير موجودة' } });
    }

    const data: any = {};
    if (dto.nameAr !== undefined) data.nameAr = dto.nameAr;
    if (dto.nameEn !== undefined) data.nameEn = dto.nameEn;
    if (dto.durationDays !== undefined) data.durationDays = dto.durationDays;
    if (dto.priceSar !== undefined) data.priceSar = dto.priceSar;
    if (dto.features !== undefined) data.features = dto.features;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.isSeasonal !== undefined) data.is_seasonal = dto.isSeasonal;
    if (dto.occasionName !== undefined) data.occasion_name = dto.occasionName;
    if (dto.discountPercent !== undefined) data.discount_percent = dto.discountPercent;
    if (dto.offerValidFrom !== undefined) data.offer_valid_from = dto.offerValidFrom ? new Date(dto.offerValidFrom) : null;
    if (dto.offerValidUntil !== undefined) data.offer_valid_until = dto.offerValidUntil ? new Date(dto.offerValidUntil) : null;

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

  async adminDeletePlan(id: string) {
    // Check if there are active subscriptions attached
    const activeSubsCount = await this.prisma.subscription.count({
      where: { planId: id, isActive: true },
    });

    if (activeSubsCount > 0) {
      // Soft-deactivate if active subscriptions exist
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
    } catch {
      await this.prisma.subscriptionPlan.update({
        where: { id },
        data: { isActive: false },
      });
      return { success: true, message: 'تم تعطيل الباقة بنجاح' };
    }
  }

  // ────────────────────────────────────────────────────
  // 🏷️ 12. Admin: Promo Codes Management (CRUD)
  // ────────────────────────────────────────────────────
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

  async adminCreatePromoCode(adminId: string, dto: CreatePromoCodeDto) {
    const existing = await this.prisma.promoCode.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException({ success: false, error: { message: 'كود الخصم مستخدم مسبقاً' } });
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

  async adminUpdatePromoCode(id: string, dto: UpdatePromoCodeDto) {
    const existing = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ success: false, error: { message: 'كود الخصم غير موجود' } });
    }

    const data: any = {};
    if (dto.code !== undefined) data.code = dto.code.toUpperCase();
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.discountType !== undefined) data.discountType = dto.discountType;
    if (dto.discountValue !== undefined) data.discountValue = dto.discountValue;
    if (dto.maxUses !== undefined) data.maxUses = dto.maxUses;
    if (dto.validFrom !== undefined) data.validFrom = dto.validFrom ? new Date(dto.validFrom) : null;
    if (dto.validUntil !== undefined) data.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

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

  async adminDeletePromoCode(id: string) {
    await this.prisma.promoCode.delete({ where: { id } });
    return { success: true, message: 'تم حذف كود الخصم بنجاح' };
  }

  // ────────────────────────────────────────────────────
  // 💰 13. Commission Settings & Transactions (Admin)
  // ────────────────────────────────────────────────────
  async getCommissionSettings() {
    const settings = await this.prisma.app_settings.findMany({
      where: {
        key: {
          in: ['default_commission_rate', 'default_trial_days', 'default_initial_balance', 'default_debt_limit', 'min_recharge_amount'],
        },
      },
    });

    const map: Record<string, string> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });

    return {
      success: true,
      data: {
        defaultCommissionRate: map['default_commission_rate'] ? Number(map['default_commission_rate']) : 1,
        defaultTrialDays: map['default_trial_days'] ? Number(map['default_trial_days']) : 30,
        defaultInitialBalance: map['default_initial_balance'] ? Number(map['default_initial_balance']) : 2000,
        defaultDebtLimit: map['default_debt_limit'] ? Number(map['default_debt_limit']) : 500,
        minRechargeAmount: map['min_recharge_amount'] ? Number(map['min_recharge_amount']) : 100,
      },
    };
  }

  async updateCommissionSettings(adminId: string, data: { defaultCommissionRate?: number; defaultTrialDays?: number; defaultInitialBalance?: number; defaultDebtLimit?: number; minRechargeAmount?: number }) {
    const updates: Promise<any>[] = [];

    if (data.defaultCommissionRate !== undefined) {
      updates.push(
        this.prisma.app_settings.upsert({
          where: { key: 'default_commission_rate' },
          update: { value: String(data.defaultCommissionRate), updated_by: adminId, updated_at: new Date() },
          create: { key: 'default_commission_rate', value: String(data.defaultCommissionRate), description: 'Default commission rate %', updated_by: adminId },
        }),
      );
    }

    if (data.defaultTrialDays !== undefined) {
      updates.push(
        this.prisma.app_settings.upsert({
          where: { key: 'default_trial_days' },
          update: { value: String(data.defaultTrialDays), updated_by: adminId, updated_at: new Date() },
          create: { key: 'default_trial_days', value: String(data.defaultTrialDays), description: 'Default trial days for new laundries', updated_by: adminId },
        }),
      );
    }

    if (data.defaultInitialBalance !== undefined) {
      updates.push(
        this.prisma.app_settings.upsert({
          where: { key: 'default_initial_balance' },
          update: { value: String(data.defaultInitialBalance), updated_by: adminId, updated_at: new Date() },
          create: { key: 'default_initial_balance', value: String(data.defaultInitialBalance), description: 'Default initial welcome balance for new laundries in SAR', updated_by: adminId },
        }),
      );
    }

    if (data.defaultDebtLimit !== undefined) {
      updates.push(
        this.prisma.app_settings.upsert({
          where: { key: 'default_debt_limit' },
          update: { value: String(data.defaultDebtLimit), updated_by: adminId, updated_at: new Date() },
          create: { key: 'default_debt_limit', value: String(data.defaultDebtLimit), description: 'Default debt limit for laundries in SAR', updated_by: adminId },
        }),
      );
    }

    if (data.minRechargeAmount !== undefined) {
      updates.push(
        this.prisma.app_settings.upsert({
          where: { key: 'min_recharge_amount' },
          update: { value: String(data.minRechargeAmount), updated_by: adminId, updated_at: new Date() },
          create: { key: 'min_recharge_amount', value: String(data.minRechargeAmount), description: 'Minimum wallet recharge amount in SAR', updated_by: adminId },
        }),
      );
    }

    await Promise.all(updates);

    return {
      success: true,
      message: 'تم حفظ إعدادات العمولات بنجاح',
    };
  }

  async getCommissionTransactions(query?: { laundryId?: string; limit?: number; offset?: number }) {
    const limit = query?.limit ? Number(query.limit) : 50;
    const offset = query?.offset ? Number(query.offset) : 0;
    const where: any = {};
    if (query?.laundryId) where.laundry_id = query.laundryId;

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
}

