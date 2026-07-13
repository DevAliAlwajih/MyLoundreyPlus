import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FirebaseService } from '../../firebase/firebase.service';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseService,
  ) {}

  // ────────────────────────────────────────────────────
  // الوظيفة الأساسية — إرسال لمستخدم بعينه
  // ────────────────────────────────────────────────────
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    options?: {
      type?: string;
      referenceId?: string;
      data?: Record<string, string>;
    },
  ) {
    // 1. جلب كل الأجهزة الفعّالة للمستخدم
    const devices = await this.prisma.userDevice.findMany({
      where: {
        userId,
        isActive : true,
        fcmToken : { not: null },
      },
      select: { fcmToken: true },
    });

    // 2. إرسال FCM إذا يوجد أجهزة وFirebase جاهز
    if (devices.length > 0 && this.firebase.isReady()) {
      const tokens = devices.map((d) => d.fcmToken!);
      try {
        const messaging = admin.messaging(this.firebase.getApp()!);
        await messaging.sendEachForMulticast({
          tokens,
          notification: { title, body },
          data        : options?.data ?? {},
          android     : { priority: 'high' },
          apns        : { payload: { aps: { sound: 'default', badge: 1 } } },
        });
      } catch (err) {
        // FCM failure لا يوقف العملية — فقط نسجّل الخطأ
        this.logger.error('FCM Error:', err);
      }
    }

    // 3. حفظ الإشعار في قاعدة البيانات دائماً
    return this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type       : options?.type,
        referenceId: options?.referenceId,
      },
    });
  }

  // ────────────────────────────────────────────────────
  // إشعار عند تغيير حالة الفاتورة
  // ────────────────────────────────────────────────────
  async sendInvoiceStatusNotification(
    customerId    : string | null,
    invoiceNumber : string,
    newStatus     : string,
    invoiceId     : string,
  ) {
    if (!customerId) return; // walk-in — لا يوجد حساب لإرسال الإشعار

    const statusMessages: Record<string, { title: string; body: string }> = {
      received : {
        title: 'تم استلام ملابسك ✅',
        body : `فاتورة ${invoiceNumber} — تم استلام ملابسك بنجاح`,
      },
      washing  : {
        title: 'ملابسك في الغسيل 🫧',
        body : `فاتورة ${invoiceNumber} — جاري غسيل ملابسك الآن`,
      },
      ironing  : {
        title: 'ملابسك في الكوي 👔',
        body : `فاتورة ${invoiceNumber} — جاري كوي ملابسك الآن`,
      },
      ready    : {
        title: 'ملابسك جاهزة للاستلام 🎉',
        body : `فاتورة ${invoiceNumber} — يمكنك استلام ملابسك الآن`,
      },
      completed: {
        title: 'تم التسليم بنجاح ⭐',
        body : `فاتورة ${invoiceNumber} — شكراً! يمكنك تقييم الخدمة الآن`,
      },
      cancelled: {
        title: 'تم إلغاء الفاتورة',
        body : `فاتورة ${invoiceNumber} — تم إلغاء الفاتورة`,
      },
    };

    const msg = statusMessages[newStatus];
    if (!msg) return;

    return this.sendToUser(customerId, msg.title, msg.body, {
      type       : 'invoice_status',
      referenceId: invoiceId,
      data       : { invoiceId, status: newStatus },
    });
  }

  // ────────────────────────────────────────────────────
  // إرسال لصاحب المغسلة
  // ────────────────────────────────────────────────────
  async sendToLaundryOwner(
    laundryId : string,
    title     : string,
    body      : string,
    options?  : { type?: string; referenceId?: string },
  ) {
    const laundry = await this.prisma.laundry.findUnique({
      where : { id: laundryId },
      select: { ownerId: true },
    });
    if (!laundry) return;
    return this.sendToUser(laundry.ownerId, title, body, options);
  }

  // ────────────────────────────────────────────────────
  // GET /notifications — قائمة إشعارات المستخدم
  // ────────────────────────────────────────────────────
  async getNotifications(
    userId    : string,
    page      : number = 1,
    limit     : number = 20,
    unreadOnly: boolean = false,
  ) {
    const where: any = { userId };
    if (unreadOnly) where.isRead = false;

    const [notifications, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip   : (page - 1) * limit,
        take   : limit,
        select : {
          id         : true,
          title      : true,
          body       : true,
          type       : true,
          referenceId: true,
          isRead     : true,
          sentAt     : true,
        },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      success: true,
      data   : notifications,
      meta   : { page, limit, total, unreadCount },
    };
  }

  // ────────────────────────────────────────────────────
  // PATCH /notifications/:id/read — تحديد إشعار كمقروء
  // ────────────────────────────────────────────────────
  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return { success: false, error: { code: 'NOTIFICATION_NOT_FOUND', message: 'الإشعار غير موجود' } };
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data : { isRead: true },
    });

    return { success: true, message: 'تم تحديد الإشعار كمقروء' };
  }

  // ────────────────────────────────────────────────────
  // PATCH /notifications/read-all — تحديد الكل كمقروء
  // ────────────────────────────────────────────────────
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data : { isRead: true },
    });

    return { success: true, message: 'تم تحديد جميع الإشعارات كمقروءة', count: result.count };
  }

  // ────────────────────────────────────────────────────
  // GET /notifications/unread-count — عدد غير المقروءة
  // ────────────────────────────────────────────────────
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { success: true, data: { count } };
  }
}
