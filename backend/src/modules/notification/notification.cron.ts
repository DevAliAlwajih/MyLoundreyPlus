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

  /**
   * يعمل كل ساعة لإرسال تنبيهات "قبل موعد التسليم"
   *
   * يقرأ من notification_prefs الخاص بكل مغسلة:
   *   deliveryReminder.enabled       → هل التنبيه مفعّل أصلاً
   *   deliveryReminder.hoursEnabled  → تفعيل التنبيه بالساعات
   *   deliveryReminder.hours         → عدد الساعات قبل الموعد
   *   deliveryReminder.daysEnabled   → تفعيل التنبيه بالأيام
   *   deliveryReminder.days          → عدد الأيام قبل الموعد
   *
   * يمنع تكرار نفس الإشعار عبر حقل reminded_at على الفاتورة.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkUpcomingInvoices() {
    this.logger.log('[DeliveryReminder] Running hourly cron job...');

    const now = new Date();

    try {
      // جلب كل الفواتير النشطة التي لديها expected_delivery_at في المستقبل
      // وليست مكتملة / ملغاة ولم يُرسَل لها تنبيه خلال آخر 20 ساعة
      const pendingInvoices = await this.prisma.invoice.findMany({
        where: {
          expected_delivery_at: { gt: now },
          status: { notIn: ['completed', 'cancelled'] },
          // نتجنب إرسال تنبيه تكراري خلال 20 ساعة لنفس الفاتورة
          OR: [
            { reminded_at: null },
            { reminded_at: { lt: new Date(now.getTime() - 20 * 60 * 60 * 1000) } },
          ],
        },
        select: {
          id: true,
          invoiceNumber: true,
          laundryId: true,
          expected_delivery_at: true,
          reminded_at: true,
          laundry: {
            select: {
              owner: {
                select: { id: true, notification_prefs: true },
              },
            },
          },
        },
      });

      if (pendingInvoices.length === 0) {
        this.logger.log('[DeliveryReminder] No pending invoices to check.');
        return;
      }

      let sentCount = 0;

      for (const invoice of pendingInvoices) {
        const prefs = (invoice.laundry?.owner?.notification_prefs as any) || {};
        const reminder = prefs?.deliveryReminder;

        // إذا كان التنبيه غير مفعّل أو معطلاً → تجاهل
        if (!reminder || reminder.enabled !== true) continue;

        const deliveryTime = new Date(invoice.expected_delivery_at!).getTime();
        const diffMs = deliveryTime - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        let shouldSend = false;
        let reminderLabel = '';

        // فحص تنبيه الساعات
        if (reminder.hoursEnabled) {
          const targetHours = reminder.hours ?? 5;
          // نُرسل إذا كان الفرق أقل من أو يساوي الساعات المحددة
          if (diffHours <= targetHours && diffHours > 0) {
            shouldSend = true;
            reminderLabel = `${Math.ceil(diffHours)} ساعة`;
          }
        }

        // فحص تنبيه الأيام (لا يُرسل إذا سبق أن قررنا الإرسال بالساعات)
        if (!shouldSend && reminder.daysEnabled) {
          const targetDays = reminder.days ?? 1;
          // نُرسل إذا كان الفرق أقل من أو يساوي الأيام المحددة (وأكثر من 20 ساعة)
          if (diffDays <= targetDays && diffDays > 0 && diffHours >= 20) {
            shouldSend = true;
            reminderLabel = `${Math.ceil(diffDays)} يوم`;
          }
        }

        if (!shouldSend) continue;

        // إرسال الإشعار
        await this.notificationService.sendToLaundryOwner(
          invoice.laundryId,
          'اقتراب موعد التسليم ⏰',
          `تذكير: الفاتورة رقم ${invoice.invoiceNumber} موعد تسليمها بعد ${reminderLabel} تقريباً.`,
          { type: 'invoice_delivery_soon', referenceId: invoice.id },
        );

        // تحديث reminded_at لمنع الإرسال المكرر
        await this.prisma.invoice.update({
          where: { id: invoice.id },
          data: { reminded_at: now },
        });

        sentCount++;
        this.logger.log(
          `[DeliveryReminder] Sent reminder for invoice ${invoice.invoiceNumber} (in ~${reminderLabel})`,
        );
      }

      this.logger.log(`[DeliveryReminder] Done. Sent ${sentCount} reminders.`);
    } catch (error) {
      this.logger.error('[DeliveryReminder] Error running cron job:', error);
    }
  }
}
