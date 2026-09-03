import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationCronService {
  private readonly logger = new Logger(NotificationCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // تشغيل المهمة كل يوم الساعة 9 صباحاً
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkUpcomingInvoices() {
    this.logger.log('Running daily cron job for upcoming invoice deliveries...');

    // حساب بداية ونهاية يوم غد
    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    try {
      // البحث عن الفواتير التي يتوقع تسليمها غداً وليست منتهية أو ملغاة
      const upcomingInvoices = await this.prisma.invoice.findMany({
        where: {
          expected_delivery_at: {
            gte: tomorrowStart,
            lte: tomorrowEnd,
          },
          status: {
            notIn: ['completed', 'cancelled'],
          },
        },
        select: {
          id: true,
          invoiceNumber: true,
          laundryId: true,
        },
      });

      if (upcomingInvoices.length === 0) {
        this.logger.log('No upcoming deliveries for tomorrow.');
        return;
      }

      this.logger.log(`Found ${upcomingInvoices.length} invoices due tomorrow.`);

      // إرسال إشعار لكل مغسلة
      for (const invoice of upcomingInvoices) {
        await this.notificationService.sendToLaundryOwner(
          invoice.laundryId,
          'اقتراب موعد التسليم ⏰',
          `تذكير: الفاتورة رقم ${invoice.invoiceNumber} موعد تسليمها غداً.`,
          { type: 'invoice_delivery_soon', referenceId: invoice.id }
        );
      }

      this.logger.log('Successfully sent delivery reminders.');
    } catch (error) {
      this.logger.error('Error running invoice delivery cron job:', error);
    }
  }
}
