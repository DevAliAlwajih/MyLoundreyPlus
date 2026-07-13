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
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
const BOOKING_SELECT = {
    id: true,
    booking_date: true,
    booking_time: true,
    status: true,
    notes: true,
    created_at: true,
    invoice_id: true,
    laundries: {
        select: { id: true, name: true, phoneNumber: true, logoUrl: true, city: true },
    },
};
const BOOKING_LAUNDRY_SELECT = {
    id: true,
    booking_date: true,
    booking_time: true,
    status: true,
    notes: true,
    created_at: true,
    invoice_id: true,
    users: {
        select: { id: true, fullName: true, phoneNumber: true, uniqueId: true },
    },
};
let BookingService = class BookingService {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
    }
    async createBooking(customerId, dto) {
        const laundry = await this.prisma.laundry.findFirst({
            where: { id: dto.laundryId, status: { in: ['active', 'trial'] } },
            select: { id: true, name: true },
        });
        if (!laundry) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'LAUNDRY_NOT_FOUND', message: 'المغسلة غير موجودة أو غير فعّالة' },
            });
        }
        const [hours, minutes] = dto.bookingTime.split(':').map(Number);
        const bookingDateTime = new Date(dto.bookingDate);
        bookingDateTime.setHours(hours, minutes, 0, 0);
        if (bookingDateTime <= new Date()) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'BOOKING_PAST_DATE', message: 'لا يمكن حجز موعد في الماضي' },
            });
        }
        const existing = await this.prisma.bookings.findFirst({
            where: {
                customer_id: customerId,
                laundry_id: dto.laundryId,
                status: { in: ['pending', 'confirmed'] },
            },
        });
        if (existing) {
            throw new common_1.ConflictException({
                success: false,
                error: { code: 'BOOKING_ALREADY_EXISTS', message: 'لديك حجز نشط بالفعل في هذه المغسلة' },
            });
        }
        const bookingTimeDate = new Date(`${dto.bookingDate}T${dto.bookingTime}:00`);
        const booking = await this.prisma.bookings.create({
            data: {
                laundries: { connect: { id: dto.laundryId } },
                users: { connect: { id: customerId } },
                booking_date: new Date(dto.bookingDate),
                booking_time: bookingTimeDate,
                notes: dto.notes,
                status: 'pending',
            },
            select: BOOKING_SELECT,
        });
        this.notificationService
            .sendToLaundryOwner(dto.laundryId, 'حجز موعد جديد 📅', `طلب حجز جديد بتاريخ ${dto.bookingDate} الساعة ${dto.bookingTime}`, { type: 'new_booking', referenceId: booking.id })
            .catch((err) => console.error('Notification error:', err));
        return { success: true, data: booking };
    }
    async getMyBookings(customerId, query) {
        const { status, page = 1, limit = 20 } = query;
        const where = { customer_id: customerId };
        if (status)
            where.status = status;
        const [bookings, total] = await this.prisma.$transaction([
            this.prisma.bookings.findMany({
                where,
                orderBy: { booking_date: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: BOOKING_SELECT,
            }),
            this.prisma.bookings.count({ where }),
        ]);
        return {
            success: true,
            data: bookings,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getMyBooking(customerId, bookingId) {
        const booking = await this.prisma.bookings.findFirst({
            where: { id: bookingId, customer_id: customerId },
            select: BOOKING_SELECT,
        });
        if (!booking) {
            this.throwBookingNotFound();
        }
        return { success: true, data: booking };
    }
    async cancelBooking(customerId, bookingId) {
        const booking = await this.prisma.bookings.findFirst({
            where: { id: bookingId, customer_id: customerId },
        });
        if (!booking) {
            this.throwBookingNotFound();
        }
        if (['completed', 'rejected', 'cancelled'].includes(booking.status)) {
            throw new common_1.BadRequestException({
                success: false,
                error: {
                    code: 'BOOKING_CANNOT_CANCEL',
                    message: `لا يمكن إلغاء حجز بحالة ${booking.status}`,
                },
            });
        }
        await this.prisma.bookings.update({
            where: { id: bookingId },
            data: { status: 'cancelled' },
        });
        this.notificationService
            .sendToLaundryOwner(booking.laundry_id, 'تم إلغاء الحجز', `العميل ألغى الحجز بتاريخ ${booking.booking_date.toLocaleDateString('ar-SA')}`, { type: 'booking_cancelled', referenceId: bookingId })
            .catch((err) => console.error('Notification error:', err));
        return { success: true, message: 'تم إلغاء الحجز' };
    }
    async getLaundryBookings(laundryId, query) {
        const { status, page = 1, limit = 20 } = query;
        const where = { laundry_id: laundryId };
        if (status)
            where.status = status;
        const [bookings, total] = await this.prisma.$transaction([
            this.prisma.bookings.findMany({
                where,
                orderBy: { booking_date: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: BOOKING_LAUNDRY_SELECT,
            }),
            this.prisma.bookings.count({ where }),
        ]);
        return {
            success: true,
            data: bookings,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getLaundryBooking(laundryId, bookingId) {
        const booking = await this.prisma.bookings.findFirst({
            where: { id: bookingId, laundry_id: laundryId },
            select: BOOKING_LAUNDRY_SELECT,
        });
        if (!booking) {
            this.throwBookingNotFound();
        }
        return { success: true, data: booking };
    }
    async updateBookingStatus(laundryId, bookingId, dto) {
        const booking = await this.prisma.bookings.findFirst({
            where: { id: bookingId, laundry_id: laundryId },
        });
        if (!booking) {
            this.throwBookingNotFound();
        }
        if (booking.status !== 'pending') {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'BOOKING_NOT_PENDING', message: 'يمكن تغيير الحالة فقط للحجوزات المعلقة' },
            });
        }
        await this.prisma.bookings.update({
            where: { id: bookingId },
            data: { status: dto.status },
        });
        const msg = dto.status === 'confirmed'
            ? {
                title: 'تم تأكيد حجزك ✅',
                body: `تم تأكيد موعدك بتاريخ ${booking.booking_date.toLocaleDateString('ar-SA')}`,
            }
            : {
                title: 'تعذّر تأكيد الحجز',
                body: `نأسف، لم يتمكن من تأكيد موعدك`,
            };
        this.notificationService
            .sendToUser(booking.customer_id, msg.title, msg.body, {
            type: 'booking_status',
            referenceId: bookingId,
        })
            .catch((err) => console.error('Notification error:', err));
        return { success: true, data: { status: dto.status } };
    }
    throwBookingNotFound() {
        throw new common_1.NotFoundException({
            success: false,
            error: { code: 'BOOKING_NOT_FOUND', message: 'الحجز غير موجود' },
        });
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], BookingService);
//# sourceMappingURL=booking.service.js.map