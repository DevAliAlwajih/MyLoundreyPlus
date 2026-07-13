import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// ────────────────────────────────────────────────────
// 🔐 SECTION 1: العميل — /bookings
// ────────────────────────────────────────────────────
@ApiTags('Bookings (Customer)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('customer')
@Controller('bookings')
export class BookingCustomerController {
  constructor(private readonly bookingService: BookingService) {}

  /** POST /api/v1/bookings — إنشاء حجز جديد */
  @Post()
  createBooking(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(req.user.id, dto);
  }

  /** GET /api/v1/bookings/my — حجوزاتي
   *  ⚠️ يجب قبل /my/:id لتجنب تعارض الـ Route
   */
  @Get('my')
  getMyBookings(@Req() req: any, @Query() query: QueryBookingDto) {
    return this.bookingService.getMyBookings(req.user.id, query);
  }

  /** GET /api/v1/bookings/my/:id — تفاصيل حجز */
  @Get('my/:id')
  getMyBooking(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookingService.getMyBooking(req.user.id, id);
  }

  /** DELETE /api/v1/bookings/my/:id — إلغاء حجز */
  @Delete('my/:id')
  cancelBooking(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookingService.cancelBooking(req.user.id, id);
  }
}

// ────────────────────────────────────────────────────
// 🔐 SECTION 2: صاحب المغسلة — /bookings/laundry
// ────────────────────────────────────────────────────
@ApiTags('Bookings (Laundry Owner)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('laundry')
@Controller('bookings')
export class BookingLaundryController {
  constructor(private readonly bookingService: BookingService) {}

  private getLaundryId(req: any): string {
    const laundryId = req.user.laundryId;
    if (!laundryId) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'NO_LAUNDRY', message: 'حسابك غير مرتبط بمغسلة' },
      });
    }
    return laundryId;
  }

  /** GET /api/v1/bookings/laundry — حجوزات مغسلتي
   *  ⚠️ يجب قبل /laundry/:id لتجنب تعارض الـ Route
   */
  @Get('laundry')
  getLaundryBookings(@Req() req: any, @Query() query: QueryBookingDto) {
    return this.bookingService.getLaundryBookings(this.getLaundryId(req), query);
  }

  /** GET /api/v1/bookings/laundry/:id — تفاصيل حجز */
  @Get('laundry/:id')
  getLaundryBooking(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookingService.getLaundryBooking(this.getLaundryId(req), id);
  }

  /** PATCH /api/v1/bookings/laundry/:id/status — تأكيد أو رفض */
  @Patch('laundry/:id/status')
  updateBookingStatus(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.updateBookingStatus(this.getLaundryId(req), id, dto);
  }
}
