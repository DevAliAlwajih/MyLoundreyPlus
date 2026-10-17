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

  // ────────────────────────────────────────────────────
  // 🔔 إرسال إشعار لجميع المديرين (Admin-facing)
  // ────────────────────────────────────────────────────
  async sendToAdmin(
    title      : string,
    body       : string,
    options?   : {
      type?       : string;
      referenceId?: string;
      actionUrl?  : string;
      data?       : Record<string, string>;
    },
  ) {
    // 1. فحص إعدادات الإشعارات (app_settings) للتأكد من عدم تعطيل هذا النوع
    if (options?.type) {
      const typeSettingMap: Record<string, string> = {
        new_laundry_registered: 'notif_new_laundry',
        new_support_ticket    : 'notif_support_ticket',
        new_chat_message      : 'notif_chat_message',
        data_update_request   : 'notif_data_update',
        debt_limit_reached    : 'notif_debt_limit',
        expiring_subscription : 'notif_expiring_sub',
        daily_summary         : 'notif_daily_summary',
      };

      const settingKey = typeSettingMap[options.type];
      if (settingKey) {
        try {
          const setting = await this.prisma.app_settings.findUnique({
            where: { key: settingKey },
          });
          if (setting && (setting.value === 'false' || setting.value === false as any)) {
            this.logger.log(`Admin notification [${options.type}] skipped: disabled by setting [${settingKey}]`);
            return;
          }
        } catch (_) {}
      }
    }

    // جلب جميع حسابات الأدمن
    const admins = await this.prisma.user.findMany({
      where : { role: 'admin' },
      select: { id: true },
    });

    if (admins.length === 0) return;

    // حفظ في قاعدة البيانات لكل أدمن (التأكد من أن referenceId هو UUID صالح لأن العمود من نوع UUID)
    const isUuid = (val?: string | null): boolean =>
      !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const safeRefId = isUuid(options?.referenceId) ? options!.referenceId : null;

    const results = await Promise.allSettled(
      admins.map((admUser) =>
        this.prisma.notification.create({
          data: {
            userId     : admUser.id,
            title,
            body,
            type       : options?.type,
            referenceId: safeRefId,
          },
        }),
      ),
    );

    results.forEach((r, idx) => {
      if (r.status === 'rejected') {
        this.logger.error(`Failed to create notification for admin ${admins[idx]?.id}:`, r.reason);
      }
    });

    // FCM للأدمن (اختياري)
    if (this.firebase.isReady()) {
      for (const admUser of admins) {
        const devices = await this.prisma.userDevice.findMany({
          where : { userId: admUser.id, isActive: true, fcmToken: { not: null } },
          select: { fcmToken: true },
        });
        if (devices.length > 0) {
          const tokens = devices.map((d) => d.fcmToken!);
          try {
            const messaging = admin.messaging(this.firebase.getApp()!);
            await messaging.sendEachForMulticast({
              tokens,
              notification: { title, body },
              data        : { ...(options?.data ?? {}), actionUrl: options?.actionUrl ?? '' },
              android     : { priority: 'high' },
              apns        : { payload: { aps: { sound: 'default', badge: 1 } } },
            });
          } catch (err) {
            this.logger.error('FCM Admin Error:', err);
          }
        }
      }
    }

    return results;
  }

  // ────────────────────────────────────────────────────
  // GET /admin/notifications — إشعارات المدير مع actionUrl
  // ────────────────────────────────────────────────────
  async getAdminNotifications(
    adminId   : string,
    page      : number = 1,
    limit     : number = 20,
    unreadOnly: boolean = false,
  ) {
    const where: any = { userId: adminId };
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
          referenceId: true,   // نستخدمه كـ actionUrl
          isRead     : true,
          sentAt     : true,
        },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId: adminId, isRead: false } }),
    ]);

    // تحويل referenceId إلى actionUrl بناءً على نوع الإشعار
    const enriched = notifications.map((n) => ({
      id        : n.id,
      title     : n.title,
      body      : n.body,
      type      : n.type,
      actionUrl : this.resolveActionUrl(n.type, n.referenceId),
      isRead    : n.isRead,
      createdAt : n.sentAt,
    }));

    return {
      success: true,
      data   : enriched,
      meta   : { page, limit, total, unreadCount },
    };
  }

  // تحويل نوع الإشعار + referenceId إلى رابط توجيه في لوحة الإدارة
  private resolveActionUrl(type?: string | null, refId?: string | null): string {
    if (refId && refId.startsWith('/')) return refId;
    if (!type) return '/dashboard';
    switch (type) {
      case 'new_laundry_registered': return refId ? `/dashboard/laundries/${refId}` : '/dashboard/laundries';
      case 'new_support_ticket'    : return refId ? `/dashboard/support?ticket=${refId}` : '/dashboard/support';
      case 'new_chat_message'      : return '/dashboard/support';
      case 'debt_limit_reached'    : return refId ? `/dashboard/laundries/${refId}` : '/dashboard/subscriptions';
      case 'data_update_request'   : return refId ? `/dashboard/laundries/${refId}` : '/dashboard/laundries';
      case 'laundry_status_changed': return refId ? `/dashboard/laundries/${refId}` : '/dashboard/laundries';
      default                      : return '/dashboard';
    }
  }
}
