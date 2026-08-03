import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { QueryBookingDto } from './dto/query-booking.dto';

// ─── Select preset لبيانات الحجز ──────────────────────
const BOOKING_SELECT = {
  id          : true,
  booking_date: true,
  booking_time: true,
  status      : true,
  notes       : true,
  created_at  : true,
  invoice_id  : true,
  laundries: {
    select: { id: true, name: true, phoneNumber: true, logoUrl: true, city: true },
  },
} as const;

const BOOKING_LAUNDRY_SELECT = {
  id          : true,
  booking_date: true,
  booking_time: true,
  status      : true,
  notes       : true,
  created_at  : true,
  invoice_id  : true,
  users: {
    select: { id: true, fullName: true, phoneNumber: true, uniqueId: true },
  },
} as const;

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // ────────────────────────────────────────────────────
  // 1. POST /bookings — إنشاء حجز جديد (العميل)
  // ────────────────────────────────────────────────────
  async createBooking(customerId: string, dto: CreateBookingDto) {
    // 1. تحقق أن المغسلة موجودة وفعّالة
    const laundry = await this.prisma.laundry.findFirst({
      where: { id: dto.laundryId, status: { not: 'banned' } },
      select: { id: true, name: true },
    });
    if (!laundry) {
      throw new NotFoundException({
        success: false,
        error: { code: 'LAUNDRY_NOT_FOUND', message: 'المغسلة غير موجودة أو غير فعّالة' },
      });
    }

    // 2. تحقق أن الموعد في المستقبل
    const [hours, minutes] = dto.bookingTime.split(':').map(Number);
    const bookingDateTime = new Date(dto.bookingDate);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    if (bookingDateTime <= new Date()) {
      throw new BadRequestException({
        success: false,
        error: { code: 'BOOKING_PAST_DATE', message: 'لا يمكن حجز موعد في الماضي' },
      });
    }

    // 3. تحقق أن العميل ليس لديه حجز نشط في نفس المغسلة
    const existing = await this.prisma.bookings.findFirst({
      where: {
        customer_id: customerId,
        laundry_id : dto.laundryId,
        status      : { in: ['pending', 'confirmed'] },
      },
    });
    if (existing) {
      throw new ConflictException({
        success: false,
        error: { code: 'BOOKING_ALREADY_EXISTS', message: 'لديك حجز نشط بالفعل في هذه المغسلة' },
      });
    }

    // 4. بناء booking_time كـ DateTime (نفس يوم الحجز بالوقت المطلوب)
    const bookingTimeDate = new Date(`${dto.bookingDate}T${dto.bookingTime}:00`);

    // 5. إنشاء الحجز
    const booking = await this.prisma.bookings.create({
      data: {
        laundries: { connect: { id: dto.laundryId } },
        users     : { connect: { id: customerId } },
        booking_date: new Date(dto.bookingDate),
        booking_time: bookingTimeDate,
        notes       : dto.notes,
        status      : 'pending',
      },
      select: BOOKING_SELECT,
    });

    // 6. إشعار لصاحب المغسلة
    this.notificationService
      .sendToLaundryOwner(
        dto.laundryId,
        'حجز موعد جديد 📅',
        `طلب حجز جديد بتاريخ ${dto.bookingDate} الساعة ${dto.bookingTime}`,
        { type: 'new_booking', referenceId: booking.id },
      )
      .catch((err) => console.error('Notification error:', err));

    return { success: true, data: booking };
  }

  // ────────────────────────────────────────────────────
  // 2. GET /bookings/my — حجوزات العميل
  // ────────────────────────────────────────────────────
  async getMyBookings(customerId: string, query: QueryBookingDto) {
    const { status, page = 1, limit = 20 } = query;

    const where: any = { customer_id: customerId };
    if (status) where.status = status;

    const [bookings, total] = await this.prisma.$transaction([
      this.prisma.bookings.findMany({
        where,
        orderBy: { booking_date: 'desc' },
        skip   : (page - 1) * limit,
        take   : limit,
        select : BOOKING_SELECT,
      }),
      this.prisma.bookings.count({ where }),
    ]);

    return {
      success: true,
      data   : bookings,
      meta   : { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ────────────────────────────────────────────────────
  // 3. GET /bookings/my/:id — تفاصيل حجز (العميل)
  // ────────────────────────────────────────────────────
  async getMyBooking(customerId: string, bookingId: string) {
    const booking = await this.prisma.bookings.findFirst({
      where : { id: bookingId, customer_id: customerId },
      select: BOOKING_SELECT,
    });
    if (!booking) {
      this.throwBookingNotFound();
    }
    return { success: true, data: booking };
  }

  // ────────────────────────────────────────────────────
  // 4. DELETE /bookings/my/:id — إلغاء حجز (العميل)
  // ────────────────────────────────────────────────────
  async cancelBooking(customerId: string, bookingId: string) {
    const booking = await this.prisma.bookings.findFirst({
      where : { id: bookingId, customer_id: customerId },
    });
    if (!booking) {
      this.throwBookingNotFound();
    }

    if (['completed', 'rejected', 'cancelled'].includes(booking!.status)) {
      throw new BadRequestException({
        success: false,
        error: {
          code   : 'BOOKING_CANNOT_CANCEL',
          message: `لا يمكن إلغاء حجز بحالة ${booking!.status}`,
        },
      });
    }

    await this.prisma.bookings.update({
      where: { id: bookingId },
      data : { status: 'cancelled' },
    });

    // إشعار للمغسلة
    this.notificationService
      .sendToLaundryOwner(
        booking!.laundry_id,
        'تم إلغاء الحجز',
        `العميل ألغى الحجز بتاريخ ${booking!.booking_date.toLocaleDateString('ar-SA')}`,
        { type: 'booking_cancelled', referenceId: bookingId },
      )
      .catch((err) => console.error('Notification error:', err));

    return { success: true, message: 'تم إلغاء الحجز' };
  }

  // ────────────────────────────────────────────────────
  // 5. GET /bookings/laundry — حجوزات المغسلة
  // ────────────────────────────────────────────────────
  async getLaundryBookings(laundryId: string, query: QueryBookingDto) {
    const { status, page = 1, limit = 20 } = query;

    const where: any = { laundry_id: laundryId };
    if (status) where.status = status;

    const [bookings, total] = await this.prisma.$transaction([
      this.prisma.bookings.findMany({
        where,
        orderBy: { booking_date: 'desc' },
        skip   : (page - 1) * limit,
        take   : limit,
        select : BOOKING_LAUNDRY_SELECT,
      }),
      this.prisma.bookings.count({ where }),
    ]);

    return {
      success: true,
      data   : bookings,
      meta   : { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ────────────────────────────────────────────────────
  // 6. GET /bookings/laundry/:id — تفاصيل حجز (المغسلة)
  // ────────────────────────────────────────────────────
  async getLaundryBooking(laundryId: string, bookingId: string) {
    const booking = await this.prisma.bookings.findFirst({
      where : { id: bookingId, laundry_id: laundryId },
      select: BOOKING_LAUNDRY_SELECT,
    });
    if (!booking) {
      this.throwBookingNotFound();
    }
    return { success: true, data: booking };
  }

  // ────────────────────────────────────────────────────
  // 7. PATCH /bookings/laundry/:id/status — تأكيد أو رفض
  // ────────────────────────────────────────────────────
  async updateBookingStatus(
    laundryId : string,
    bookingId : string,
    dto       : UpdateBookingStatusDto,
  ) {
    const booking = await this.prisma.bookings.findFirst({
      where: { id: bookingId, laundry_id: laundryId },
    });
    if (!booking) {
      this.throwBookingNotFound();
    }

    if (booking!.status !== 'pending') {
      throw new BadRequestException({
        success: false,
        error: { code: 'BOOKING_NOT_PENDING', message: 'يمكن تغيير الحالة فقط للحجوزات المعلقة' },
      });
    }

    await this.prisma.bookings.update({
      where: { id: bookingId },
      data : { status: dto.status },
    });

    // إشعار للعميل
    const msg = dto.status === 'confirmed'
      ? {
          title: 'تم تأكيد حجزك ✅',
          body : `تم تأكيد موعدك بتاريخ ${booking!.booking_date.toLocaleDateString('ar-SA')}`,
        }
      : {
          title: 'تعذّر تأكيد الحجز',
          body : `نأسف، لم يتمكن من تأكيد موعدك`,
        };

    this.notificationService
      .sendToUser(booking!.customer_id, msg.title, msg.body, {
        type       : 'booking_status',
        referenceId: bookingId,
      })
      .catch((err) => console.error('Notification error:', err));

    return { success: true, data: { status: dto.status } };
  }

  // ─── Private Helpers ──────────────────────────────────
  private throwBookingNotFound(): never {
    throw new NotFoundException({
      success: false,
      error: { code: 'BOOKING_NOT_FOUND', message: 'الحجز غير موجود' },
    });
  }
}
