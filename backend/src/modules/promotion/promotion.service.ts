import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { QueryPromotionDto } from './dto/query-promotion.dto';

@Injectable()
export class PromotionService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────────
  // 1. GET /promotions/laundry/:laundryId — عروض مغسلة (Public)
  // ────────────────────────────────────────────────────
  async getLaundryPromotions(laundryId: string) {
    const today = new Date();

    const promotions = await this.prisma.promotion.findMany({
      where: {
        laundryId,
        isActive: true,
        OR: [{ startDate: null }, { startDate: { lte: today } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: today } }] }],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    });

    return { success: true, data: promotions };
  }

  // ────────────────────────────────────────────────────
  // 2. GET /promotions/:id — تفاصيل عرض (Public)
  // ────────────────────────────────────────────────────
  async getPromotionDetails(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });
    if (!promotion) {
      throw new NotFoundException({
        success: false,
        error: { code: 'PROMOTION_NOT_FOUND', message: 'العرض غير موجود' },
      });
    }

    return { success: true, data: promotion };
  }

  // ────────────────────────────────────────────────────
  // 3. POST /promotions/:id/view — تسجيل مشاهدة (Public)
  // ────────────────────────────────────────────────────
  async recordView(promotionId: string, userId?: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });
    if (!promotion) {
      throw new NotFoundException({
        success: false,
        error: { code: 'PROMOTION_NOT_FOUND', message: 'العرض غير موجود' },
      });
    }

    if (userId) {
      await this.prisma.promotion_views
        .create({
          data: {
            promotions: { connect: { id: promotionId } },
            users: { connect: { id: userId } },
          },
        })
        .catch(() => {
          // تجاهل الأخطاء الصامتة (مثل القيود المتكررة للمشاهدة)
        });
    }

    return { success: true };
  }

  // ────────────────────────────────────────────────────
  // 4. GET /promotions/my — عروضي للمغسلة
  // ────────────────────────────────────────────────────
  async getMyPromotions(laundryId: string, dto: QueryPromotionDto) {
    const today = new Date();
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const [promotions, total] = await this.prisma.$transaction([
      this.prisma.promotion.findMany({
        where: { laundryId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.promotion.count({ where: { laundryId } }),
    ]);

    // إضافة عدد المشاهدات وحالة الصلاحية
    const withStats = await Promise.all(
      promotions.map(async (p) => {
        const viewsCount = await this.prisma.promotion_views.count({
          where: { promotion_id: p.id },
        });
        const isExpired = p.endDate ? new Date(p.endDate) < today : false;
        const isUpcoming = p.startDate ? new Date(p.startDate) > today : false;
        return { ...p, viewsCount, isExpired, isUpcoming };
      }),
    );

    return {
      success: true,
      data: withStats,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ────────────────────────────────────────────────────
  // 5. POST /promotions — إنشاء عرض جديد
  // ────────────────────────────────────────────────────
  async createPromotion(laundryId: string, dto: CreatePromotionDto) {
    // تحقق من التواريخ
    if (dto.startDate && dto.endDate) {
      if (new Date(dto.endDate) <= new Date(dto.startDate)) {
        throw new BadRequestException({
          success: false,
          error: { code: 'INVALID_DATE_RANGE', message: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية' },
        });
      }
    }

    const promotion = await this.prisma.promotion.create({
      data: {
        laundry: { connect: { id: laundryId } },
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: true,
      },
    });

    return { success: true, data: promotion };
  }

  // ────────────────────────────────────────────────────
  // 6. PATCH /promotions/:id — تعديل عرض
  // ────────────────────────────────────────────────────
  async updatePromotion(laundryId: string, promotionId: string, dto: UpdatePromotionDto) {
    const existing = await this.prisma.promotion.findFirst({
      where: { id: promotionId, laundryId },
    });
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'PROMOTION_NOT_FOUND', message: 'العرض غير موجود' },
      });
    }

    const startDate = dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : existing.startDate;
    const endDate = dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : existing.endDate;

    if (startDate && endDate && endDate <= startDate) {
      throw new BadRequestException({
        success: false,
        error: { code: 'INVALID_DATE_RANGE', message: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية' },
      });
    }

    const updated = await this.prisma.promotion.update({
      where: { id: promotionId },
      data: {
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        startDate: dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : undefined,
        endDate: dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : undefined,
      },
    });

    return { success: true, data: updated };
  }

  // ────────────────────────────────────────────────────
  // 7. DELETE /promotions/:id — حذف عرض
  // ────────────────────────────────────────────────────
  async deletePromotion(laundryId: string, promotionId: string) {
    const promotion = await this.prisma.promotion.findFirst({
      where: { id: promotionId, laundryId },
    });
    if (!promotion) {
      throw new NotFoundException({
        success: false,
        error: { code: 'PROMOTION_NOT_FOUND', message: 'العرض غير موجود' },
      });
    }

    await this.prisma.promotion.delete({ where: { id: promotionId } });
    return { success: true, message: 'تم حذف العرض' };
  }

  // ────────────────────────────────────────────────────
  // 8. PATCH /promotions/:id/toggle — تفعيل/تعطيل
  // ────────────────────────────────────────────────────
  async togglePromotion(laundryId: string, promotionId: string) {
    const promotion = await this.prisma.promotion.findFirst({
      where: { id: promotionId, laundryId },
    });
    if (!promotion) {
      throw new NotFoundException({
        success: false,
        error: { code: 'PROMOTION_NOT_FOUND', message: 'العرض غير موجود' },
      });
    }

    const updated = await this.prisma.promotion.update({
      where: { id: promotionId },
      data: { isActive: !promotion.isActive },
    });

    return {
      success: true,
      data: { id: promotionId, isActive: updated.isActive },
    };
  }
}
