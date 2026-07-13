import { Module } from '@nestjs/common';
import { BookingCustomerController, BookingLaundryController } from './booking.controller';
import { BookingService } from './booking.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports    : [PrismaModule, NotificationModule],
  controllers: [BookingCustomerController, BookingLaundryController],
  providers  : [BookingService],
  exports    : [BookingService],
})
export class BookingModule {}
