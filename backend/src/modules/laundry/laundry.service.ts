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
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';

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
  ) { }

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

    if (laundry.status === 'banned') {
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

    if (laundry.status === 'banned') {
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
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.nameAr !== undefined && { nameAr: dto.nameAr }),
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.workingHours !== undefined && { workingHours: dto.workingHours }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        // إعدادات الضريبة
        ...(dto.tax_enabled !== undefined && { tax_enabled: dto.tax_enabled }),
        ...(dto.tax_rate !== undefined && { tax_rate: dto.tax_rate }),
        // إعدادات الاستعجال
        ...(dto.urgency_enabled !== undefined && { urgency_enabled: dto.urgency_enabled }),
        ...(dto.urgency_fee !== undefined && { urgency_fee: dto.urgency_fee }),
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
            id: true,
            nameAr: true,
            nameEn: true,
            basePrice: true,
            washing_price: true,
            ironing_price: true,
            isActive: true,
            sortOrder: true,
            laundryPrices: {
              where: { laundryId: laundry.id },
              select: { price: true, isAvailable: true },
              take: 1,
            },
          },
        },
      },
    });

    const menuData = categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
      items: cat.items.map((item) => {
        const lp = item.laundryPrices[0] ?? null;
        return {
          itemId: item.id,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          // غسيل + كوي (السعر الافتراضي — من المغسلة أولاً)
          fullServicePrice: lp ? Number(lp.price) : Number(item.basePrice),
          // غسيل فقط
          washingPrice: item.washing_price ? Number(item.washing_price) : null,
          // كوي فقط
          ironingPrice: item.ironing_price ? Number(item.ironing_price) : null,
          isAvailable: lp?.isAvailable ?? true,
          isActive: item.isActive,
          sortOrder: item.sortOrder,
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
        nameAr: dto.nameAr,
        nameEn: dto.nameEn || dto.nameAr,
        basePrice: dto.basePrice,
        washing_price: dto.washing_price,
        ironing_price: dto.ironing_price,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        basePrice: true,
        washing_price: true,
        ironing_price: true,
        sortOrder: true,
        isActive: true,
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
        ...(dto.nameAr !== undefined && { nameAr: dto.nameAr }),
        ...(dto.nameEn !== undefined && { nameEn: dto.nameEn }),
        ...(dto.basePrice !== undefined && { basePrice: dto.basePrice }),
        ...(dto.washing_price !== undefined && { washing_price: dto.washing_price }),
        ...(dto.ironing_price !== undefined && { ironing_price: dto.ironing_price }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        basePrice: true,
        washing_price: true,
        ironing_price: true,
        sortOrder: true,
        isActive: true,
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
  // 14. Wallet & Commission Transactions
  // ──────────────────────────────────────────────

  async getWallet(ownerId: string) {
    const laundry = await this.prisma.laundry.findFirst({
      where: { ownerId },
      select: {
        id: true,
        balance: true,
        billing_type: true,
        commission_rate: true,
        trial_commission_ends_at: true,
      },
    });

    if (!laundry) {
      throw new NotFoundException({
        success: false,
        error: { code: 'LAUNDRY_NOT_FOUND', message: 'المغسلة غير موجودة' },
      });
    }

    let actualCommissionRate = laundry.commission_rate ? Number(laundry.commission_rate) : null;

    if (actualCommissionRate === null && laundry.billing_type === 'commission') {
      const defaultRateSetting = await this.prisma.app_settings.findUnique({
        where: { key: 'default_commission_rate' },
      });
      actualCommissionRate = defaultRateSetting?.value ? Number(defaultRateSetting.value) : 10;
    }

    return {
      success: true,
      data: {
        balance: Number(laundry.balance),
        billingType: laundry.billing_type,
        commissionRate: actualCommissionRate,
        trialCommissionEndsAt: laundry.trial_commission_ends_at,
      },
    };
  }

  async getWalletTransactions(ownerId: string, page: number = 1, limit: number = 20) {
    const laundry = await this.getLaundryByOwner(ownerId);

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.commissionTransaction.findMany({
        where: { laundry_id: laundry.id },
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(limit),
        include: {
          invoice: {
            select: { invoiceNumber: true },
          },
        },
      }),
      this.prisma.commissionTransaction.count({
        where: { laundry_id: laundry.id },
      }),
    ]);

    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      invoiceId: t.invoice_id,
      invoiceNumber: t.invoice?.invoiceNumber,
      invoiceTotal: Number(t.invoice_total),
      commissionRate: Number(t.commission_rate),
      commissionAmount: Number(t.commission_amount),
      balanceAfter: Number(t.balance_after),
      createdAt: t.created_at,
    }));

    return {
      success: true,
      data: formattedTransactions,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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
      WITH InvoiceStats AS (
        SELECT 
          customer_id,
          walk_in_phone,
          MAX(walk_in_name) as walk_in_name,
          COUNT(id)::int AS total_invoices,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::int AS completed_invoices,
          SUM(CASE WHEN payment_type = 'deferred' AND (total_amount - paid_amount) > 0 THEN (total_amount - paid_amount) ELSE 0 END) AS deferred_balance,
          MAX(created_at) AS last_visit
        FROM invoices
        WHERE laundry_id = ${laundryId}::uuid
        GROUP BY customer_id, walk_in_phone
      ),
      LocalProfiles AS (
        SELECT * FROM laundry_customer_profiles
        WHERE laundry_id = ${laundryId}::uuid
      )
      SELECT 
        COALESCE(u.id::text, istats.walk_in_phone, lcp.customer_id::text, lcp.phone) AS "customerId",
        COALESCE(lcp.local_name, u.full_name, istats.walk_in_name) AS "customerName",
        COALESCE(lcp.local_phone, u.phone_number, istats.walk_in_phone, lcp.phone) AS "customerPhone",
        COALESCE(istats.total_invoices, 0)::int AS "totalInvoices",
        COALESCE(istats.completed_invoices, 0)::int AS "completedInvoices",
        COALESCE(istats.deferred_balance, 0) AS "deferredBalance",
        COALESCE(istats.last_visit, lcp.updated_at, lcp.created_at) AS "lastVisit"
      FROM InvoiceStats istats
      FULL OUTER JOIN LocalProfiles lcp 
        ON COALESCE(istats.customer_id::text, istats.walk_in_phone) = COALESCE(lcp.customer_id::text, lcp.phone)
      LEFT JOIN users u ON u.id = COALESCE(istats.customer_id, lcp.customer_id)
      WHERE 1=1
        ${searchFilter ? Prisma.sql`AND (lcp.local_name ILIKE ${searchFilter} OR lcp.local_phone ILIKE ${searchFilter} OR u.full_name ILIKE ${searchFilter} OR u.phone_number ILIKE ${searchFilter} OR istats.walk_in_name ILIKE ${searchFilter} OR istats.walk_in_phone ILIKE ${searchFilter})` : Prisma.empty}
        ${from_date ? Prisma.sql`AND COALESCE(istats.last_visit, lcp.updated_at, lcp.created_at) >= ${new Date(from_date)}` : Prisma.empty}
        ${to_date ? Prisma.sql`AND COALESCE(istats.last_visit, lcp.updated_at, lcp.created_at) <= ${new Date(to_date)}` : Prisma.empty}
        ${has_debt ? Prisma.sql`AND COALESCE(istats.deferred_balance, 0) > 0` : Prisma.empty}
      ORDER BY "lastVisit" DESC
    `;

    const customers = await this.prisma.$queryRaw(query);

    return { success: true, data: customers };
  }

  async getCustomerDetail(ownerId: string, customerId: string) {
    const laundry = await this.getLaundryByOwner(ownerId);
    const laundryId = laundry.id;

    // Determine if customerId is a UUID (registered user) or phone/name (walk-in)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(customerId);

    // 1. Fetch local profile first (may exist even without invoices)
    const localProfile = await this.prisma.laundryCustomerProfile.findFirst({
      where: isUuid
        ? { laundryId, customerId }
        : { laundryId, phone: customerId }
    });

    // 2. Build invoice search condition
    let invoiceWhereClause: any = { laundryId };
    if (isUuid) {
      invoiceWhereClause.customerId = customerId;
    } else {
      invoiceWhereClause.OR = [
        { walk_in_phone: customerId },
        {
          walk_in_name: customerId,
          OR: [{ walk_in_phone: "" }, { walk_in_phone: null }]
        }
      ];
    }

    const invoices = await this.prisma.invoice.findMany({
      where: invoiceWhereClause,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { fullName: true, phoneNumber: true } },
        items: true,
      }
    });

    // 3. If no local profile AND no invoices -> 404
    if (invoices.length === 0 && !localProfile) {
      throw new NotFoundException({
        success: false,
        error: { code: "CUSTOMER_NOT_FOUND", message: "العميل غير موجود" }
      });
    }

    // 4. Determine base customer data
    const firstInvoice = invoices.length > 0 ? invoices[0] : null;
    const originalName = firstInvoice?.customer?.fullName || firstInvoice?.walk_in_name || null;
    const originalPhone = firstInvoice?.customer?.phoneNumber || firstInvoice?.walk_in_phone || null;

    const customerName = localProfile?.localName || originalName || "";
    const customerPhone = localProfile?.localPhone || originalPhone || "";
    const customerNotes = localProfile?.notes || null;

    // 5. Compute stats from invoices
    let deferredBalance = 0;
    let totalSpent = 0;
    let completedInvoicesCount = 0;

    const mappedInvoices = invoices.map(inv => {
      const dueAmount = Number(inv.totalAmount) - Number(inv.paidAmount);
      if (inv.paymentType === "deferred" && dueAmount > 0) {
        deferredBalance += dueAmount;
      }
      totalSpent += Number(inv.paidAmount);
      if (inv.status === "completed") {
        completedInvoicesCount++;
      }

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        customerName: inv.customer?.fullName || inv.walk_in_name || "",
        customerPhone: inv.customer?.phoneNumber || inv.walk_in_phone || "",
        paymentType: inv.paymentType,
        isUrgent: inv.urgency_fee && Number(inv.urgency_fee) > 0 ? true : false,
        notes: inv.notes || "",
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
          itemId: item.itemId || "",
          itemName: item.itemName,
          itemNameAr: item.item_name_ar || item.itemName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.subtotal),
          notes: ""
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
      notes: customerNotes,
      totalInvoices: invoices.length,
      completedInvoices: completedInvoicesCount,
      deferredBalance,
      lastVisit: firstInvoice ? firstInvoice.createdAt.toISOString() : null,
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

  async updateCustomerProfile(ownerId: string, customerId: string, dto: UpdateCustomerProfileDto) {
    const laundry = await this.getLaundryByOwner(ownerId);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(customerId);

    const data = {
      localName: dto.localName,
      localPhone: dto.localPhone,
      notes: dto.notes,
    };

    if (isUuid) {
      const profile = await this.prisma.laundryCustomerProfile.upsert({
        where: { laundryId_customerId: { laundryId: laundry.id, customerId } },
        update: data,
        create: {
          laundryId: laundry.id,
          customerId,
          ...data,
        },
      });
      return { success: true, data: profile };
    } else {
      const profile = await this.prisma.laundryCustomerProfile.upsert({
        where: { laundryId_phone: { laundryId: laundry.id, phone: customerId } },
        update: data,
        create: {
          laundryId: laundry.id,
          phone: customerId,
          ...data,
        },
      });
      return { success: true, data: profile };
    }
  }
}
