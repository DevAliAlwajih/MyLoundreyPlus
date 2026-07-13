import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceLaundryController, InvoiceCustomerController } from './invoice.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports    : [NotificationModule],
  controllers: [InvoiceLaundryController, InvoiceCustomerController],
  providers  : [InvoiceService],
  exports    : [InvoiceService],
})
export class InvoiceModule {}
