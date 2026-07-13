import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { QueryRatingDto } from './dto/query-rating.dto';

@Injectable()
export class RatingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // ────────────────────────────────────────────────────
  // 1. POST /ratings — إنشاء تقييم جديد
  // ────────────────────────────────────────────────────
  async createRating(customerId: string, dto: CreateRatingDto) {
    // 1. جلب الفاتورة
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      select: { id: true, customerId: true, laundryId: true, status: true },
    });

    if (!invoice) {
      throw new NotFoundException({
        success: false,
        error: { code: 'INVOICE_NOT_FOUND', message: 'الفاتورة غير موجودة' },
      });
    }

    // 2. القاعدة الذهبية — الفاتورة يجب أن تكون مكتملة
    if (invoice.status !== 'completed') {
      throw new UnprocessableEntityException({
        success: false,
        error: {
          code: 'INVOICE_NOT_COMPLETED',
          message: 'لا يمكن التقييم إلا بعد اكتمال الفاتورة',
        },
      });
    }

    // 3. تحقق أن العميل هو صاحب الفاتورة
    if (invoice.customerId !== customerId) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'RATING_FORBIDDEN', message: 'لا يمكنك تقييم فاتورة لا تخصك' },
      });
    }

    // 4. تحقق أنه لم يقيّم من قبل
    const existing = await this.prisma.rating.findUnique({
      where: { invoiceId: dto.invoiceId },
    });

    if (existing) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'ALREADY_RATED',
          message: 'لقد قيّمت هذه الفاتورة مسبقاً',
        },
      });
    }

    // 5. إنشاء التقييم
    const rating = await this.prisma.rating.create({
      data: {
        invoice: { connect: { id: dto.invoiceId } },
        customer: { connect: { id: customerId } },
        laundry: { connect: { id: invoice.laundryId } },
        stars: dto.stars,
        comment: dto.comment,
      },
    });

    // DB Trigger يحدّث rating_avg في laundries تلقائياً

    // 6. إشعار لصاحب المغسلة
    const starsIcon = '⭐'.repeat(dto.stars);
    this.notificationService
      .sendToLaundryOwner(
        invoice.laundryId,
        `تقييم جديد ${starsIcon}`,
        dto.comment ? `"${dto.comment}"` : `حصلت على تقييم ${dto.stars} نجوم`,
        { type: 'new_rating', referenceId: rating.id },
      )
      .catch((err) => console.error('Notification error:', err));

    return { success: true, data: rating };
  }

  // ────────────────────────────────────────────────────
  // 2. GET /ratings/can-rate/:invoiceId — هل يمكن التقييم؟
  // ────────────────────────────────────────────────────
  async canRate(customerId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { customerId: true, status: true },
    });

    if (!invoice || invoice.customerId !== customerId) {
      return { success: true, data: { canRate: false, reason: 'الفاتورة غير موجودة' } };
    }

    if (invoice.status !== 'completed') {
      return { success: true, data: { canRate: false, reason: 'الفاتورة لم تكتمل بعد' } };
    }

    const existing = await this.prisma.rating.findUnique({
      where: { invoiceId },
    });

    if (existing) {
      return {
        success: true,
        data: { canRate: false, reason: 'قيّمت مسبقاً', existingRating: existing },
      };
    }

    return { success: true, data: { canRate: true } };
  }

  // ────────────────────────────────────────────────────
  // 3. GET /ratings/laundry/:laundryId — تقييمات مغسلة (عام)
  // ────────────────────────────────────────────────────
  async getLaundryRatings(laundryId: string, dto: QueryRatingDto) {
    const { page = 1, limit = 20, stars } = dto;
    const where: any = { laundryId };
    if (stars) where.stars = stars;

    const [ratings, total, laundry] = await this.prisma.$transaction([
      this.prisma.rating.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          stars: true,
          comment: true,
          createdAt: true,
          customer: { select: { fullName: true, avatarUrl: true } },
        },
      }),
      this.prisma.rating.count({ where }),
      this.prisma.laundry.findUnique({
        where: { id: laundryId },
        select: { ratingAvg: true, ratingCount: true },
      }),
    ]);

    // توزيع النجوم
    const distribution = await this.prisma.rating.groupBy({
      by: ['stars'],
      where: { laundryId },
      _count: true,
    });

    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => {
      dist[d.stars] = d._count;
    });

    return {
      success: true,
      data: {
        summary: {
          ratingAvg: laundry?.ratingAvg !== null ? Number(laundry?.ratingAvg) : 0,
          ratingCount: laundry?.ratingCount ?? 0,
          distribution: dist,
        },
        reviews: ratings,
      },
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ────────────────────────────────────────────────────
  // 4. GET /ratings/my — تقييماتي
  // ────────────────────────────────────────────────────
  async getMyRatings(customerId: string) {
    const ratings = await this.prisma.rating.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        stars: true,
        comment: true,
        createdAt: true,
        laundry: { select: { id: true, name: true, logoUrl: true } },
        invoice: { select: { invoiceNumber: true } },
      },
    });

    return { success: true, data: ratings };
  }
}
