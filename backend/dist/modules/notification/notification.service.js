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
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const firebase_service_1 = require("../../firebase/firebase.service");
const admin = require("firebase-admin");
let NotificationService = NotificationService_1 = class NotificationService {
    constructor(prisma, firebase) {
        this.prisma = prisma;
        this.firebase = firebase;
        this.logger = new common_1.Logger(NotificationService_1.name);
    }
    async sendToUser(userId, title, body, options) {
        const devices = await this.prisma.userDevice.findMany({
            where: {
                userId,
                isActive: true,
                fcmToken: { not: null },
            },
            select: { fcmToken: true },
        });
        if (devices.length > 0 && this.firebase.isReady()) {
            const tokens = devices.map((d) => d.fcmToken);
            try {
                const messaging = admin.messaging(this.firebase.getApp());
                await messaging.sendEachForMulticast({
                    tokens,
                    notification: { title, body },
                    data: options?.data ?? {},
                    android: { priority: 'high' },
                    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
                });
            }
            catch (err) {
                this.logger.error('FCM Error:', err);
            }
        }
        return this.prisma.notification.create({
            data: {
                userId,
                title,
                body,
                type: options?.type,
                referenceId: options?.referenceId,
            },
        });
    }
    async sendInvoiceStatusNotification(customerId, invoiceNumber, newStatus, invoiceId) {
        if (!customerId)
            return;
        const statusMessages = {
            received: {
                title: 'تم استلام ملابسك ✅',
                body: `فاتورة ${invoiceNumber} — تم استلام ملابسك بنجاح`,
            },
            washing: {
                title: 'ملابسك في الغسيل 🫧',
                body: `فاتورة ${invoiceNumber} — جاري غسيل ملابسك الآن`,
            },
            ironing: {
                title: 'ملابسك في الكوي 👔',
                body: `فاتورة ${invoiceNumber} — جاري كوي ملابسك الآن`,
            },
            ready: {
                title: 'ملابسك جاهزة للاستلام 🎉',
                body: `فاتورة ${invoiceNumber} — يمكنك استلام ملابسك الآن`,
            },
            completed: {
                title: 'تم التسليم بنجاح ⭐',
                body: `فاتورة ${invoiceNumber} — شكراً! يمكنك تقييم الخدمة الآن`,
            },
            cancelled: {
                title: 'تم إلغاء الفاتورة',
                body: `فاتورة ${invoiceNumber} — تم إلغاء الفاتورة`,
            },
        };
        const msg = statusMessages[newStatus];
        if (!msg)
            return;
        return this.sendToUser(customerId, msg.title, msg.body, {
            type: 'invoice_status',
            referenceId: invoiceId,
            data: { invoiceId, status: newStatus },
        });
    }
    async sendToLaundryOwner(laundryId, title, body, options) {
        const laundry = await this.prisma.laundry.findUnique({
            where: { id: laundryId },
            select: { ownerId: true },
        });
        if (!laundry)
            return;
        return this.sendToUser(laundry.ownerId, title, body, options);
    }
    async getNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
        const where = { userId };
        if (unreadOnly)
            where.isRead = false;
        const [notifications, total, unreadCount] = await this.prisma.$transaction([
            this.prisma.notification.findMany({
                where,
                orderBy: { sentAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    body: true,
                    type: true,
                    referenceId: true,
                    isRead: true,
                    sentAt: true,
                },
            }),
            this.prisma.notification.count({ where }),
            this.prisma.notification.count({ where: { userId, isRead: false } }),
        ]);
        return {
            success: true,
            data: notifications,
            meta: { page, limit, total, unreadCount },
        };
    }
    async markAsRead(userId, notificationId) {
        const notification = await this.prisma.notification.findFirst({
            where: { id: notificationId, userId },
        });
        if (!notification) {
            return { success: false, error: { code: 'NOTIFICATION_NOT_FOUND', message: 'الإشعار غير موجود' } };
        }
        await this.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
        return { success: true, message: 'تم تحديد الإشعار كمقروء' };
    }
    async markAllAsRead(userId) {
        const result = await this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return { success: true, message: 'تم تحديد جميع الإشعارات كمقروءة', count: result.count };
    }
    async getUnreadCount(userId) {
        const count = await this.prisma.notification.count({
            where: { userId, isRead: false },
        });
        return { success: true, data: { count } };
    }
    async sendToAdmin(title, body, options) {
        if (options?.type) {
            const typeSettingMap = {
                new_laundry_registered: 'notif_new_laundry',
                new_support_ticket: 'notif_support_ticket',
                new_chat_message: 'notif_chat_message',
                data_update_request: 'notif_data_update',
                debt_limit_reached: 'notif_debt_limit',
                expiring_subscription: 'notif_expiring_sub',
                daily_summary: 'notif_daily_summary',
            };
            const settingKey = typeSettingMap[options.type];
            if (settingKey) {
                try {
                    const setting = await this.prisma.app_settings.findUnique({
                        where: { key: settingKey },
                    });
                    if (setting && (setting.value === 'false' || setting.value === false)) {
                        this.logger.log(`Admin notification [${options.type}] skipped: disabled by setting [${settingKey}]`);
                        return;
                    }
                }
                catch (_) { }
            }
        }
        const admins = await this.prisma.user.findMany({
            where: { role: 'admin' },
            select: { id: true },
        });
        if (admins.length === 0)
            return;
        const isUuid = (val) => !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        const safeRefId = isUuid(options?.referenceId) ? options.referenceId : null;
        const results = await Promise.allSettled(admins.map((admUser) => this.prisma.notification.create({
            data: {
                userId: admUser.id,
                title,
                body,
                type: options?.type,
                referenceId: safeRefId,
            },
        })));
        results.forEach((r, idx) => {
            if (r.status === 'rejected') {
                this.logger.error(`Failed to create notification for admin ${admins[idx]?.id}:`, r.reason);
            }
        });
        if (this.firebase.isReady()) {
            for (const admUser of admins) {
                const devices = await this.prisma.userDevice.findMany({
                    where: { userId: admUser.id, isActive: true, fcmToken: { not: null } },
                    select: { fcmToken: true },
                });
                if (devices.length > 0) {
                    const tokens = devices.map((d) => d.fcmToken);
                    try {
                        const messaging = admin.messaging(this.firebase.getApp());
                        await messaging.sendEachForMulticast({
                            tokens,
                            notification: { title, body },
                            data: { ...(options?.data ?? {}), actionUrl: options?.actionUrl ?? '' },
                            android: { priority: 'high' },
                            apns: { payload: { aps: { sound: 'default', badge: 1 } } },
                        });
                    }
                    catch (err) {
                        this.logger.error('FCM Admin Error:', err);
                    }
                }
            }
        }
        return results;
    }
    async getAdminNotifications(adminId, page = 1, limit = 20, unreadOnly = false) {
        const where = { userId: adminId };
        if (unreadOnly)
            where.isRead = false;
        const [notifications, total, unreadCount] = await this.prisma.$transaction([
            this.prisma.notification.findMany({
                where,
                orderBy: { sentAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    body: true,
                    type: true,
                    referenceId: true,
                    isRead: true,
                    sentAt: true,
                },
            }),
            this.prisma.notification.count({ where }),
            this.prisma.notification.count({ where: { userId: adminId, isRead: false } }),
        ]);
        const enriched = notifications.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            type: n.type,
            actionUrl: this.resolveActionUrl(n.type, n.referenceId),
            isRead: n.isRead,
            createdAt: n.sentAt,
        }));
        return {
            success: true,
            data: enriched,
            meta: { page, limit, total, unreadCount },
        };
    }
    resolveActionUrl(type, refId) {
        if (refId && refId.startsWith('/'))
            return refId;
        if (!type)
            return '/dashboard';
        switch (type) {
            case 'new_laundry_registered': return refId ? `/dashboard/laundries/${refId}` : '/dashboard/laundries';
            case 'new_support_ticket': return refId ? `/dashboard/support?ticket=${refId}` : '/dashboard/support';
            case 'new_chat_message': return '/dashboard/support';
            case 'debt_limit_reached': return refId ? `/dashboard/laundries/${refId}` : '/dashboard/subscriptions';
            case 'data_update_request': return refId ? `/dashboard/laundries/${refId}` : '/dashboard/laundries';
            case 'laundry_status_changed': return refId ? `/dashboard/laundries/${refId}` : '/dashboard/laundries';
            default: return '/dashboard';
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        firebase_service_1.FirebaseService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map