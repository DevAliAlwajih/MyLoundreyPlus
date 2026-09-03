import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationCronService } from './notification.cron';

@Module({
  imports    : [PrismaModule],
  controllers: [NotificationController],
  providers  : [NotificationService, NotificationCronService],
  exports    : [NotificationService], // ← يُصدَّر ليُستخدَم في InvoiceModule
})
export class NotificationModule {}
