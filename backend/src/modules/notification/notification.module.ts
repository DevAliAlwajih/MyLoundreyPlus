import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports    : [PrismaModule],
  controllers: [NotificationController],
  providers  : [NotificationService],
  exports    : [NotificationService], // ← يُصدَّر ليُستخدَم في InvoiceModule
})
export class NotificationModule {}
