import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { QueryAdDto } from './dto/query-ad.dto';

@Injectable()
export class AdsService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────────
  // 1. GET /ads — للإعلانات النشطة (تظهر في التطبيق)
  // ────────────────────────────────────────────────────
  async getActiveAds(userRole?: string, audienceQuery?: string) {
    const today = new Date();
    // تحديد الجمهور بناءً على دور المستخدم إذا لم يتم تمريره كـ Query
    const audience = audienceQuery
      ? audienceQuery
      : userRole === 'laundry'
        ? 'laundries'
        : 'customers';

    const ads = await this.prisma.ad.findMany({
      where: {
        isActive: true,
        targetAudience: { in: ['all', audience] as any[] },
        OR: [{ startDate: null }, { startDate: { lte: today } }],
        AND: [
          {
            OR: [{ endDate: null }, { endDate: { gte: today } }],
          },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        mediaUrls: true,
        bodyText: true,
        linkUrl: true,
        targetAudience: true,
        adFee: true,
        startDate: true,
        endDate: true,
      },
    });

    return { success: true, data: ads };
  }

  // ────────────────────────────────────────────────────
  // 2. GET /ads/:id — تفاصيل إعلان
  // ────────────────────────────────────────────────────
  async getAdDetails(id: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id, isActive: true },
    });

    if (!ad) {
      throw new NotFoundException({
        success: false,
        error: { code: 'AD_NOT_FOUND', message: 'الإعلان غير موجود أو غير نشط' },
      });
    }

    return { success: true, data: ad };
  }

  // ────────────────────────────────────────────────────
  // 3. POST /ads/:id/view — تسجيل مشاهدة للإحصائيات
  // ────────────────────────────────────────────────────
  async recordView(adId: string, userId?: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id: adId, isActive: true },
    });

    if (!ad) {
      throw new NotFoundException({
        success: false,
        error: { code: 'AD_NOT_FOUND', message: 'الإعلان غير موجود' },
      });
    }

    // حفظ المشاهدة إذا كان المستخدم مسجلاً
    if (userId) {
      await this.prisma.promotion_views
        .create({
          data: {
            ads: { connect: { id: adId } },
            users: { connect: { id: userId } },
          },
        })
        .catch(() => {
          // يتم تجاهل الخطأ في حال كانت هناك قيود تمنع المشاهدة المتكررة
        });
    }

    return { success: true };
  }

  // ────────────────────────────────────────────────────
  // 4. POST /ads — إنشاء إعلان جديد (Admin)
  // ────────────────────────────────────────────────────
  async createAd(adminId: string, dto: CreateAdDto) {
    const ad = await this.prisma.ad.create({
      data: {
        title: dto.title,
        mediaUrls: dto.mediaUrls,
        bodyText: dto.bodyText,
        linkUrl: dto.linkUrl,
        targetAudience: (dto.targetAudience as any) ?? 'all',
        adFee: dto.adFee ?? 0,
        sortOrder: dto.sortOrder ?? 0,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: true,
        creator: { connect: { id: adminId } },
      },
    });

    return { success: true, data: ad };
  }

  // ────────────────────────────────────────────────────
  // 5. PATCH /ads/:id — تعديل إعلان (Admin)
  // ────────────────────────────────────────────────────
  async updateAd(id: string, dto: UpdateAdDto) {
    const existing = await this.prisma.ad.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'AD_NOT_FOUND', message: 'الإعلان غير موجود' },
      });
    }

    const dataToUpdate: any = { ...dto };
    if (dto.startDate) dataToUpdate.startDate = new Date(dto.startDate);
    if (dto.endDate) dataToUpdate.endDate = new Date(dto.endDate);
    if (dto.targetAudience) dataToUpdate.targetAudience = dto.targetAudience;

    const updatedAd = await this.prisma.ad.update({
      where: { id },
      data: dataToUpdate,
    });

    return { success: true, data: updatedAd };
  }

  // ────────────────────────────────────────────────────
  // 6. DELETE /ads/:id — حذف إعلان (Admin)
  // ────────────────────────────────────────────────────
  async deleteAd(id: string) {
    const ad = await this.prisma.ad.findUnique({ where: { id } });
    if (!ad) {
      throw new NotFoundException({
        success: false,
        error: { code: 'AD_NOT_FOUND', message: 'الإعلان غير موجود' },
      });
    }

    await this.prisma.ad.delete({ where: { id } });

    return { success: true, message: 'تم حذف الإعلان بنجاح' };
  }

  // ────────────────────────────────────────────────────
  // 7. PATCH /ads/:id/toggle — تفعيل/تعطيل إعلان (Admin)
  // ────────────────────────────────────────────────────
  async toggleAd(id: string) {
    const ad = await this.prisma.ad.findUnique({ where: { id } });
    if (!ad) {
      throw new NotFoundException({
        success: false,
        error: { code: 'AD_NOT_FOUND', message: 'الإعلان غير موجود' },
      });
    }

    const updated = await this.prisma.ad.update({
      where: { id },
      data: { isActive: !ad.isActive },
    });

    return {
      success: true,
      data: { id, isActive: updated.isActive },
    };
  }

  // ────────────────────────────────────────────────────
  // 8. GET /ads/admin/all — كل الإعلانات للإدارة (Admin)
  // ────────────────────────────────────────────────────
  async getAllAdsForAdmin(dto: QueryAdDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const [ads, total] = await this.prisma.$transaction([
      this.prisma.ad.findMany({
        orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ad.count(),
    ]);

    // إضافة عدد المشاهدات لكل إعلان
    const adsWithViews = await Promise.all(
      ads.map(async (ad) => {
        const views = await this.prisma.promotion_views.count({
          where: { ad_id: ad.id },
        });
        return { ...ad, viewsCount: views };
      }),
    );

    return {
      success: true,
      data: adsWithViews,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
