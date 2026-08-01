import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { QueryLaundryDto } from './dto/query-laundry.dto';
import { UpdateLaundryDto } from './dto/update-laundry.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateItemDto, UpdateItemDto, UpdatePriceDto } from './dto/item.dto';
import { CreateHolidayDto } from './dto/create-holiday.dto';

// ─────────────────────────────────────────
// Haversine Formula — حساب المسافة بالكيلومتر
// ─────────────────────────────────────────
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // تقريب لـ 2 خانة عشرية
}

// ─────────────────────────────────────────
// Helper — select آمن لبيانات المغسلة العامة
// ─────────────────────────────────────────
const LAUNDRY_PUBLIC_SELECT = {
  id: true,
  name: true,
  nameAr: true,
  phoneNumber: true,
  address: true,
  city: true,
  country: true,
  latitude: true,
  longitude: true,
  workingHours: true,
  logoUrl: true,
  status: true,
  ratingAvg: true,
  ratingCount: true,
  createdAt: true,
} as const;

@Injectable()
export class LaundryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // ──────────────────────────────────────────────
  // 1. GET /laundries — قائمة المغاسل العامة
  // ──────────────────────────────────────────────
  async findAll(query: QueryLaundryDto) {
    const {
      lat,
      lng,
      radius = 10,
      sort = 'distance',
      city,
      country,
      page = 1,
      limit = 20,
    } = query;

    const hasLocation = lat !== undefined && lng !== undefined;

    // بناء الـ where clause
    const where: any = { status: 'active' };
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (country) where.country = country;

    // جلب كل المغاسل المطابقة (للفلترة الجغرافية نحتاج كل النتائج أولاً)
    const allLaundries = await this.prisma.laundry.findMany({
      where,
      select: LAUNDRY_PUBLIC_SELECT,
    });

    // ─── الفلترة الجغرافية بـ Haversine ───
    let results = allLaundries.map((l) => {
      let distanceKm: number | null = null;

      if (
        hasLocation &&
        l.latitude !== null &&
        l.longitude !== null
      ) {
        distanceKm = haversineKm(
          lat!,
          lng!,
          Number(l.latitude),
          Number(l.longitude),
        );
      }

      return {
        id: l.id,
        name: l.name,
        nameAr: l.nameAr,
        city: l.city,
        country: l.country,
        logoUrl: l.logoUrl,
        workingHours: l.workingHours,
        ratingAvg: l.ratingAvg ? Number(l.ratingAvg) : null,
        ratingCount: l.ratingCount,
        distanceKm,
      };
    });

    // ─── فلترة حسب الـ radius (إذا كان هناك موقع) ───
    if (hasLocation) {
      results = results.filter(
        (l) => l.distanceKm === null || l.distanceKm <= radius,
      );
    }

    // ─── الترتيب ───
    if (sort === 'distance' && hasLocation) {
      results.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    } else if (sort === 'rating') {
      results.sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0));
    }
    // 'price' sort → يتطلب جلب الأسعار — سنتركه بدون ترتيب إضافي للآن

    // ─── Pagination يدوي بعد الفلترة ───
    const total = results.length;
    const skip = (page - 1) * limit;
    const paginated = results.slice(skip, skip + limit);

    return {
      success: true,
      data: paginated,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ──────────────────────────────────────────────
  // 2. GET /laundries/:id — تفاصيل مغسلة
  // ──────────────────────────────────────────────
  async findOne(id: string) {
    const laundry = await this.prisma.laundry.findUnique({
      where: { id },
      select: LAUNDRY_PUBLIC_SELECT,
    });

    if (!laundry) {
      throw new NotFoundException({
        success: false,
        error: { code: 'LAUNDRY_NOT_FOUND', message: 'المغسلة غير موجودة' },
      });
    }

    if (laundry.status !== 'active') {
      throw new ForbiddenException({
        success: false,
        error: { code: 'LAUNDRY_INACTIVE', message: 'المغسلة غير متاحة حالياً' },
      });
    }

    return {
      success: true,
      data: {
        ...laundry,
        ratingAvg: laundry.ratingAvg ? Number(laundry.ratingAvg) : null,
        latitude: laundry.latitude ? Number(laundry.latitude) : null,
        longitude: laundry.longitude ? Number(laundry.longitude) : null,
      },
    };
  }

  // ──────────────────────────────────────────────
  // 3. GET /laundries/:id/menu — قائمة الأصناف
  // ──────────────────────────────────────────────
  async getMenu(laundryId: string) {
    // تحقق من وجود المغسلة
    const laundry = await this.prisma.laundry.findUnique({
      where: { id: laundryId },
      select: { id: true, status: true },
    });

    if (!laundry) {
      throw new NotFoundException({
        success: false,
        error: { code: 'LAUNDRY_NOT_FOUND', message: 'المغسلة غير موجودة' },
      });
    }

    if (laundry.status !== 'active') {
      throw new ForbiddenException({
        success: false,
        error: { code: 'LAUNDRY_INACTIVE', message: 'المغسلة غير متاحة حالياً' },
      });
    }

    // جلب الأقسام مع العناصر وأسعار المغسلة
    const categories = await this.prisma.category.findMany({
      where: { laundryId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        sortOrder: true,
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            basePrice: true,
            laundryPrices: {
              where: { laundryId },
              select: { price: true, isAvailable: true },
              take: 1,
            },
          },
        },
      },
    });

    // بناء الـ response مع منطق السعر الصحيح
    const menuData = categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      items: cat.items.map((item) => {
        const laundryPrice = item.laundryPrices[0] ?? null;

        // 🔑 المنطق الحرج: سعر المغسلة أولاً → base_price كـ fallback
        const price = laundryPrice
          ? Number(laundryPrice.price)
          : Number(item.basePrice);

        return {
          itemId: item.id,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          price,
          isAvailable: laundryPrice?.isAvailable ?? true,
        };
      }),
    }));

    return { success: true, data: menuData };
  }

  // ──────────────────────────────────────────────
  // 4. GET /my-laundry — بيانات مغسلة المالك
  // ──────────────────────────────────────────────
  async getMyLaundry(ownerId: string) {
    const laundry = await this.prisma.laundry.findFirst({
      where: { ownerId },
      select: {
        ...LAUNDRY_PUBLIC_SELECT,
        tax_enabled: true,
        tax_rate: true,
        urgency_enabled: true,
        urgency_fee: true,
      },
    });

    if (!laundry) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'LAUNDRY_NOT_FOUND',
          message: 'لا توجد مغسلة مرتبطة بحسابك',
        },
      });
    }

    return {
      success: true,
      data: {
        ...laundry,
        ratingAvg: laundry.ratingAvg ? Number(laundry.ratingAvg) : null,
        latitude: laundry.latitude ? Number(laundry.latitude) : null,
        longitude: laundry.longitude ? Number(laundry.longitude) : null,
      },
    };
  }

  // ──────────────────────────────────────────────
  // 5. PATCH /my-laundry — تحديث بيانات المغسلة
  // ──────────────────────────────────────────────
  async updateMyLaundry(ownerId: string, dto: UpdateLaundryDto) {
    const laundry = await this.prisma.laundry.findFirst({
      where: { ownerId },
      select: { id: true },
    });

    if (!laundry) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'LAUNDRY_NOT_FOUND',
          message: 'لا توجد مغسلة مرتبطة بحسابك',
        },
      });
    }

    const updated = await this.prisma.laundry.update({
      where: { id: laundry.id },
      data: {
        ...(dto.name !== undefined          && { name: dto.name }),
        ...(dto.nameAr !== undefined        && { nameAr: dto.nameAr }),
        ...(dto.phoneNumber !== undefined   && { phoneNumber: dto.phoneNumber }),
        ...(dto.address !== undefined       && { address: dto.address }),
        ...(dto.city !== undefined          && { city: dto.city }),
        ...(dto.country !== undefined       && { country: dto.country }),
        ...(dto.latitude !== undefined      && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined     && { longitude: dto.longitude }),
        ...(dto.workingHours !== undefined  && { workingHours: dto.workingHours }),
        ...(dto.logoUrl !== undefined       && { logoUrl: dto.logoUrl }),
        // إعدادات الضريبة
        ...(dto.tax_enabled !== undefined   && { tax_enabled: dto.tax_enabled }),
        ...(dto.tax_rate !== undefined      && { tax_rate: dto.tax_rate }),
        // إعدادات الاستعجال
        ...(dto.urgency_enabled !== undefined && { urgency_enabled: dto.urgency_enabled }),
        ...(dto.urgency_fee !== undefined   && { urgency_fee: dto.urgency_fee }),
        updatedAt: new Date(),
      },
      select: {
        ...LAUNDRY_PUBLIC_SELECT,
        tax_enabled: true,
        tax_rate: true,
        urgency_enabled: true,
        urgency_fee: true,
      },
    });

    return {
      success: true,
      data: {
        ...updated,
        ratingAvg: updated.ratingAvg ? Number(updated.ratingAvg) : null,
        latitude: updated.latitude ? Number(updated.latitude) : null,
        longitude: updated.longitude ? Number(updated.longitude) : null,
      },
    };
  }

  // ──────────────────────────────────────────────
  // 6. GET /my-laundry/menu — قائمة المالك (تشمل غير النشط)
  // ──────────────────────────────────────────────
  async getMyMenu(ownerId: string) {
    const laundry = await this.prisma.laundry.findFirst({
      where: { ownerId },
      select: { id: true },
    });

    if (!laundry) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'LAUNDRY_NOT_FOUND',
          message: 'لا توجد مغسلة مرتبطة بحسابك',
        },
      });
    }

    const categories = await this.prisma.category.findMany({
      where: { laundryId: laundry.id },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        sortOrder: true,
        isActive: true,
        items: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id            : true,
            nameAr        : true,
            nameEn        : true,
            basePrice     : true,
            washing_price : true,
            ironing_price : true,
            isActive      : true,
            sortOrder     : true,
            laundryPrices : {
              where: { laundryId: laundry.id },
              select: { price: true, isAvailable: true },
              take: 1,
            },
          },
        },
      },
    });

    const menuData = categories.map((cat) => ({
      categoryId  : cat.id,
      categoryName: cat.name,
      sortOrder   : cat.sortOrder,
      isActive    : cat.isActive,
      items: cat.items.map((item) => {
        const lp = item.laundryPrices[0] ?? null;
        return {
          itemId          : item.id,
          nameAr          : item.nameAr,
          nameEn          : item.nameEn,
          // غسيل + كوي (السعر الافتراضي — من المغسلة أولاً)
          fullServicePrice: lp ? Number(lp.price) : Number(item.basePrice),
          // غسيل فقط
          washingPrice    : item.washing_price ? Number(item.washing_price) : null,
          // كوي فقط
          ironingPrice    : item.ironing_price ? Number(item.ironing_price) : null,
          isAvailable     : lp?.isAvailable ?? true,
          isActive        : item.isActive,
          sortOrder       : item.sortOrder,
        };
      }),
    }));

    return { success: true, data: menuData };
  }

  // ──────────────────────────────────────────────
  // 7. POST /my-laundry/categories — إضافة قسم
  // ──────────────────────────────────────────────
  async createCategory(ownerId: string, dto: CreateCategoryDto) {
    const laundry = await this.getLaundryByOwner(ownerId);

    const category = await this.prisma.category.create({
      data: {
        laundryId: laundry.id,
        name: dto.name,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
      select: { id: true, name: true, sortOrder: true, isActive: true },
    });

    return { success: true, data: category };
  }

  // ──────────────────────────────────────────────
  // 8. PATCH /my-laundry/categories/:id
  // ──────────────────────────────────────────────
  async updateCategory(ownerId: string, categoryId: string, dto: UpdateCategoryDto) {
    const laundry = await this.getLaundryByOwner(ownerId);

    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, laundryId: laundry.id },
    });

    if (!category) {
      throw new NotFoundException({
        success: false,
        error: { code: 'CATEGORY_NOT_FOUND', message: 'القسم غير موجود' },
      });
    }

    const updated = await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: { id: true, name: true, sortOrder: true, isActive: true },
    });

    return { success: true, data: updated };
  }

  // ──────────────────────────────────────────────
  // 9. DELETE /my-laundry/categories/:id
  // ──────────────────────────────────────────────
  async deleteCategory(ownerId: string, categoryId: string) {
    const laundry = await this.getLaundryByOwner(ownerId);

    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, laundryId: laundry.id },
    });

    if (!category) {
      throw new NotFoundException({
        success: false,
        error: { code: 'CATEGORY_NOT_FOUND', message: 'القسم غير موجود' },
      });
    }

    await this.prisma.category.delete({ where: { id: categoryId } });

    return { success: true, message: 'تم حذف القسم بنجاح' };
  }

  // ──────────────────────────────────────────────
  // 10. POST /my-laundry/items — إضافة صنف لقسم
  // ──────────────────────────────────────────────
  async createItem(ownerId: string, categoryId: string, dto: CreateItemDto) {
    const laundry = await this.getLaundryByOwner(ownerId);

    // تحقق أن القسم ينتمي للمغسلة
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, laundryId: laundry.id },
    });

    if (!category) {
      throw new NotFoundException({
        success: false,
        error: { code: 'CATEGORY_NOT_FOUND', message: 'القسم غير موجود' },
      });
    }

    const item = await this.prisma.item.create({
      data: {
        categoryId,
        nameAr        : dto.nameAr,
        nameEn        : dto.nameEn || dto.nameAr,
        basePrice     : dto.basePrice,
        washing_price : dto.washing_price,
        ironing_price : dto.ironing_price,
        sortOrder     : dto.sortOrder ?? 0,
        isActive      : dto.isActive ?? true,
      },
      select: {
        id            : true,
        nameAr        : true,
        nameEn        : true,
        basePrice     : true,
        washing_price : true,
        ironing_price : true,
        sortOrder     : true,
        isActive      : true,
      },
    });

    return {
      success: true,
      data: { ...item, basePrice: Number(item.basePrice) },
    };
  }

  // ──────────────────────────────────────────────
  // 11. PATCH /my-laundry/items/:id
  // ──────────────────────────────────────────────
  async updateItem(ownerId: string, itemId: string, dto: UpdateItemDto) {
    const laundry = await this.getLaundryByOwner(ownerId);

    // تحقق ملكية الـ item عبر category → laundry
    const item = await this.prisma.item.findFirst({
      where: {
        id: itemId,
        category: { laundryId: laundry.id },
      },
    });

    if (!item) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ITEM_NOT_FOUND', message: 'الصنف غير موجود' },
      });
    }

    const updated = await this.prisma.item.update({
      where: { id: itemId },
      data: {
        ...(dto.nameAr !== undefined        && { nameAr: dto.nameAr }),
        ...(dto.nameEn !== undefined        && { nameEn: dto.nameEn }),
        ...(dto.basePrice !== undefined     && { basePrice: dto.basePrice }),
        ...(dto.washing_price !== undefined && { washing_price: dto.washing_price }),
        ...(dto.ironing_price !== undefined && { ironing_price: dto.ironing_price }),
        ...(dto.sortOrder !== undefined     && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined      && { isActive: dto.isActive }),
      },
      select: {
        id            : true,
        nameAr        : true,
        nameEn        : true,
        basePrice     : true,
        washing_price : true,
        ironing_price : true,
        sortOrder     : true,
        isActive      : true,
      },
    });

    return {
      success: true,
      data: { ...updated, basePrice: Number(updated.basePrice) },
    };
  }

  // ──────────────────────────────────────────────
  // 12. DELETE /my-laundry/items/:id
  // ──────────────────────────────────────────────
  async deleteItem(ownerId: string, itemId: string) {
    const laundry = await this.getLaundryByOwner(ownerId);

    const item = await this.prisma.item.findFirst({
      where: {
        id: itemId,
        category: { laundryId: laundry.id },
      },
    });

    if (!item) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ITEM_NOT_FOUND', message: 'الصنف غير موجود' },
      });
    }

    await this.prisma.item.delete({ where: { id: itemId } });

    return { success: true, message: 'تم حذف الصنف بنجاح' };
  }

  // ──────────────────────────────────────────────
  // 13. PATCH /my-laundry/prices/:itemId — upsert سعر صنف
  // ──────────────────────────────────────────────
  async upsertPrice(ownerId: string, itemId: string, dto: UpdatePriceDto) {
    const laundry = await this.getLaundryByOwner(ownerId);

    // تحقق أن الصنف ينتمي لمغسلة المالك
    const item = await this.prisma.item.findFirst({
      where: {
        id: itemId,
        category: { laundryId: laundry.id },
      },
      select: { id: true, basePrice: true },
    });

    if (!item) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ITEM_NOT_FOUND', message: 'الصنف غير موجود' },
      });
    }

    // استخدم base_price كـ fallback إذا لم يُرسل سعر جديد
    const priceToSet = dto.price !== undefined ? dto.price : Number(item.basePrice);

    const laundryPrice = await this.prisma.laundryPrice.upsert({
      where: {
        laundryId_itemId: { laundryId: laundry.id, itemId },
      },
      update: {
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
        updatedAt: new Date(),
      },
      create: {
        laundryId: laundry.id,
        itemId,
        price: priceToSet,
        isAvailable: dto.isAvailable ?? true,
      },
      select: {
        itemId: true,
        price: true,
        isAvailable: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: { ...laundryPrice, price: Number(laundryPrice.price) },
    };
  }

  // ──────────────────────────────────────────────
  // 12. Holidays (الإجازات الاستثنائية)
  // ──────────────────────────────────────────────

  async getHolidays(ownerId: string, upcoming: boolean) {
    const laundry = await this.getLaundryByOwner(ownerId);

    const whereClause: any = { laundryId: laundry.id };
    if (upcoming) {
      // جلب الإجازات من تاريخ اليوم فصاعداً
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      whereClause.date = { gte: today };
    }

    const holidays = await this.prisma.laundryHoliday.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
      select: { id: true, date: true, reason: true },
    });

    // Formatting date to YYYY-MM-DD for consistency
    const formattedHolidays = holidays.map(h => ({
      ...h,
      date: h.date.toISOString().split('T')[0],
    }));

    return { success: true, data: formattedHolidays };
  }

  async addHoliday(ownerId: string, dto: CreateHolidayDto) {
    const laundry = await this.getLaundryByOwner(ownerId);

    // تحويل السلسلة النصية إلى كائن Date صالح للـ DB
    const holidayDate = new Date(dto.date);

    // التحقق من أن التاريخ ليس في الماضي
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (holidayDate < today) {
      throw new BadRequestException({
        success: false,
        error: { code: 'INVALID_DATE', message: 'لا يمكن إضافة إجازة لتاريخ مضى' },
      });
    }

    // إضافة الإجازة مع التقاط خطأ التكرار (Unique Constraint)
    try {
      const holiday = await this.prisma.laundryHoliday.create({
        data: {
          laundryId: laundry.id,
          date: holidayDate,
          reason: dto.reason,
        },
        select: { id: true, date: true, reason: true },
      });

      return {
        success: true,
        data: { ...holiday, date: holiday.date.toISOString().split('T')[0] },
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException({
          success: false,
          error: { code: 'DUPLICATE_HOLIDAY', message: 'هذا التاريخ مسجل كإجازة بالفعل' },
        });
      }
      throw error;
    }
  }

  async deleteHoliday(ownerId: string, id: string) {
    const laundry = await this.getLaundryByOwner(ownerId);

    const holiday = await this.prisma.laundryHoliday.findFirst({
      where: { id, laundryId: laundry.id },
    });

    if (!holiday) {
      throw new NotFoundException({
        success: false,
        error: { code: 'HOLIDAY_NOT_FOUND', message: 'الإجازة غير موجودة' },
      });
    }

    await this.prisma.laundryHoliday.delete({
      where: { id },
    });

    return { success: true, message: 'تم حذف الإجازة بنجاح' };
  }

  // ──────────────────────────────────────────────
  // Helper خاص — جلب المغسلة بـ ownerId
  // ──────────────────────────────────────────────
  private async getLaundryByOwner(ownerId: string) {
    const laundry = await this.prisma.laundry.findFirst({
      where: { ownerId },
      select: { id: true, name: true },
    });

    if (!laundry) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'LAUNDRY_NOT_FOUND',
          message: 'لا توجد مغسلة مرتبطة بحسابك',
        },
      });
    }

    return laundry;
  }
  // ──────────────────────────────────────────────
  // Reports (My Laundry)
  // ──────────────────────────────────────────────

  async getReports(ownerId: string, period?: string, from?: string, to?: string) {
    const laundry = await this.getLaundryByOwner(ownerId);
    
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
    } else {
      switch (period) {
        case 'year':
          startDate.setFullYear(today.getFullYear(), 0, 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'hour':
          startDate.setHours(startDate.getHours() - 1);
          break;
        case 'day':
        default:
          startDate.setHours(0, 0, 0, 0);
          break;
      }
    }
    
    // 1. Payment Breakdown (within date range, excluding cancelled)
    const paymentGroups = await this.prisma.invoice.groupBy({
      by: ['paymentType'],
      where: {
        laundryId: laundry.id,
        status: { not: 'cancelled' },
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true },
    });
    
    // 2. Status Summary (within date range)
    const statusGroups = await this.prisma.invoice.groupBy({
      by: ['status'],
      where: {
        laundryId: laundry.id,
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: { _all: true },
    });

    // 3. Outstanding Deferred Debt (ALL TIME, not limited by date)
    const debtResult = await this.prisma.invoice.aggregate({
      where: {
        laundryId: laundry.id,
        paymentType: 'deferred',
        status: { not: 'cancelled' }
      },
      _sum: { totalAmount: true, paidAmount: true },
    });
    
    const totalDeferredOutstanding = (Number(debtResult._sum.totalAmount || 0) - Number(debtResult._sum.paidAmount || 0));

    let cash = 0;
    let card = 0;
    let deferred = 0;
    let electronic = 0;

    paymentGroups.forEach(g => {
      const amt = Number(g._sum.totalAmount || 0);
      if (g.paymentType === 'cash') cash += amt;
      if (g.paymentType === 'card') card += amt;
      if (g.paymentType === 'deferred') deferred += amt;
      if (g.paymentType === 'electronic') electronic += amt;
    });

    const totalRevenue = cash + card + deferred + electronic;

    let completedCount = 0;
    let cancelledCount = 0;
    let processingCount = 0;

    statusGroups.forEach(g => {
      if (g.status === 'completed') {
        completedCount += g._count._all;
      } else if (g.status === 'cancelled') {
        cancelledCount += g._count._all;
      } else if (['received', 'washing', 'ironing', 'ready'].includes(g.status)) {
        processingCount += g._count._all;
      }
    });

    return {
      success: true,
      data: {
        paymentBreakdown: {
          cash,
          card,
          deferred,
          electronic,
          total: totalRevenue
        },
        statusSummary: {
          completed: completedCount,
          cancelled: cancelledCount,
          processing: processingCount
        },
        totalOutstandingDebt: totalDeferredOutstanding > 0 ? totalDeferredOutstanding : 0
      }
    };
  }

  // ──────────────────────────────────────────────
  // CRM Methods
  // ──────────────────────────────────────────────

  async getCustomers(ownerId: string, search?: string, from_date?: string, to_date?: string, has_debt?: boolean) {
    const laundry = await this.getLaundryByOwner(ownerId);
    const laundryId = laundry.id;

    // We use Prisma queryRaw to perform the aggregation
    const searchFilter = search ? `%${search}%` : null;

    const query = Prisma.sql`
      SELECT 
        COALESCE(u.id::text, i.walk_in_phone) AS "customerId",
        COALESCE(u.full_name, i.walk_in_name) AS "customerName",
        COALESCE(u.phone_number, i.walk_in_phone) AS "customerPhone",
        COUNT(i.id)::int AS "totalInvoices",
        SUM(CASE WHEN i.status = 'completed' THEN 1 ELSE 0 END)::int AS "completedInvoices",
        SUM(CASE WHEN i.payment_type = 'deferred' AND (i.total_amount - i.paid_amount) > 0 THEN (i.total_amount - i.paid_amount) ELSE 0 END) AS "deferredBalance",
        MAX(i.created_at) AS "lastVisit"
      FROM invoices i
      LEFT JOIN users u ON i.customer_id = u.id
      WHERE i.laundry_id = ${laundryId}::uuid
        ${searchFilter ? Prisma.sql`AND (u.full_name ILIKE ${searchFilter} OR u.phone_number ILIKE ${searchFilter} OR i.walk_in_name ILIKE ${searchFilter} OR i.walk_in_phone ILIKE ${searchFilter})` : Prisma.empty}
        ${from_date ? Prisma.sql`AND i.created_at >= ${new Date(from_date)}` : Prisma.empty}
        ${to_date ? Prisma.sql`AND i.created_at <= ${new Date(to_date)}` : Prisma.empty}
      GROUP BY "customerId", "customerName", "customerPhone"
      ${has_debt ? Prisma.sql`HAVING SUM(CASE WHEN i.payment_type = 'deferred' AND (i.total_amount - i.paid_amount) > 0 THEN (i.total_amount - i.paid_amount) ELSE 0 END) > 0` : Prisma.empty}
      ORDER BY "lastVisit" DESC
    `;

    const customers = await this.prisma.$queryRaw(query);

    return { success: true, data: customers };
  }

  async getCustomerDetail(ownerId: string, customerId: string) {
    const laundry = await this.getLaundryByOwner(ownerId);
    const laundryId = laundry.id;

    // Determine if customerId is a UUID (registered user) or phone (walk-in)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(customerId);

    let whereClause: any = { laundryId };
    if (isUuid) {
      whereClause.customerId = customerId;
    } else {
      whereClause.walk_in_phone = customerId;
    }

    const invoices = await this.prisma.invoice.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { fullName: true, phoneNumber: true } },
        items: true,
      }
    });

    if (invoices.length === 0) {
      throw new NotFoundException({
        success: false,
        error: { code: 'CUSTOMER_NOT_FOUND', message: 'العميل غير موجود' }
      });
    }

    const firstInvoice = invoices[0];
    const customerName = firstInvoice.customer?.fullName || firstInvoice.walk_in_name;
    const customerPhone = firstInvoice.customer?.phoneNumber || firstInvoice.walk_in_phone;

    let deferredBalance = 0;
    let totalSpent = 0;
    let completedInvoices = 0;

    const mappedInvoices = invoices.map(inv => {
      const dueAmount = Number(inv.totalAmount) - Number(inv.paidAmount);
      if (inv.paymentType === 'deferred' && dueAmount > 0) {
        deferredBalance += dueAmount;
      }
      totalSpent += Number(inv.paidAmount);
      if (inv.status === 'completed') {
        completedInvoices++;
      }

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        customerName: inv.customer?.fullName || inv.walk_in_name || '',
        customerPhone: inv.customer?.phoneNumber || inv.walk_in_phone || '',
        paymentType: inv.paymentType,
        isUrgent: inv.urgency_fee && Number(inv.urgency_fee) > 0 ? true : false,
        notes: inv.notes || '',
        subtotal: Number(inv.subtotal),
        discountPercent: 0,
        discountAmount: Number(inv.discount),
        urgencyFeePercent: 0,
        urgencyFeeAmount: Number(inv.urgency_fee),
        taxPercent: 0,
        taxAmount: Number(inv.tax_amount),
        total: Number(inv.totalAmount),
        paidAmount: Number(inv.paidAmount),
        dueAmount: dueAmount,
        items: inv.items.map(item => ({
          id: item.id,
          itemId: item.itemId || '',
          itemName: item.itemName,
          itemNameAr: item.item_name_ar || item.itemName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.subtotal),
          notes: ''
        })),
        statusHistory: [],
        createdAt: inv.createdAt.toISOString(),
        expectedDeliveryAt: inv.expected_delivery_at?.toISOString()
      };
    });

    const customerDetail = {
      customerId,
      customerName,
      customerPhone,
      totalInvoices: invoices.length,
      completedInvoices,
      deferredBalance,
      lastVisit: invoices[0].createdAt.toISOString(),
      totalSpent,
      invoices: mappedInvoices
    };

    return { success: true, data: customerDetail };
  }

  async remindCustomer(ownerId: string, customerId: string, channel: 'whatsapp' | 'app' | 'both') {
    const laundry = await this.getLaundryByOwner(ownerId);
    
    // Check if the customerId is a registered UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(customerId);

    if ((channel === 'app' || channel === 'both') && isUuid) {
      const user = await this.prisma.user.findUnique({ where: { id: customerId } });
      
      if (user) {
        await this.notificationService.sendToUser(
          user.id,
          'تذكير بمديونية 🔔',
          `لديك مديونية مستحقة لدى مغسلة ${laundry.name || 'المغسلة'}، نرجو السداد في أقرب وقت.`,
          { type: 'DEBT_REMINDER' }
        );
      }
    }

    return { success: true, message: 'تم إرسال التذكير / رابط واتساب جاهز' };
  }
}
