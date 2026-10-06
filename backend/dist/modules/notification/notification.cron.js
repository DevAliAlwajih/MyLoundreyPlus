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
var NotificationCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_service_1 = require("./notification.service");
let NotificationCronService = NotificationCronService_1 = class NotificationCronService {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
        this.logger = new common_1.Logger(NotificationCronService_1.name);
    }
    async checkUpcomingInvoices() {
        this.logger.log('[DeliveryReminder] Running hourly cron job...');
        const now = new Date();
        try {
            const pendingInvoices = await this.prisma.invoice.findMany({
                where: {
                    expected_delivery_at: { gt: now },
                    status: { notIn: ['completed', 'cancelled'] },
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
                const prefs = invoice.laundry?.owner?.notification_prefs || {};
                const reminder = prefs?.deliveryReminder;
                if (!reminder || reminder.enabled !== true)
                    continue;
                const deliveryTime = new Date(invoice.expected_delivery_at).getTime();
                const diffMs = deliveryTime - now.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);
                const diffDays = diffMs / (1000 * 60 * 60 * 24);
                let shouldSend = false;
                let reminderLabel = '';
                if (reminder.hoursEnabled) {
                    const targetHours = reminder.hours ?? 5;
                    if (diffHours <= targetHours && diffHours > 0) {
                        shouldSend = true;
                        reminderLabel = `${Math.ceil(diffHours)} ساعة`;
                    }
                }
                if (!shouldSend && reminder.daysEnabled) {
                    const targetDays = reminder.days ?? 1;
                    if (diffDays <= targetDays && diffDays > 0 && diffHours >= 20) {
                        shouldSend = true;
                        reminderLabel = `${Math.ceil(diffDays)} يوم`;
                    }
                }
                if (!shouldSend)
                    continue;
                await this.notificationService.sendToLaundryOwner(invoice.laundryId, 'اقتراب موعد التسليم ⏰', `تذكير: الفاتورة رقم ${invoice.invoiceNumber} موعد تسليمها بعد ${reminderLabel} تقريباً.`, { type: 'invoice_delivery_soon', referenceId: invoice.id });
                await this.prisma.invoice.update({
                    where: { id: invoice.id },
                    data: { reminded_at: now },
                });
                sentCount++;
                this.logger.log(`[DeliveryReminder] Sent reminder for invoice ${invoice.invoiceNumber} (in ~${reminderLabel})`);
            }
            this.logger.log(`[DeliveryReminder] Done. Sent ${sentCount} reminders.`);
        }
        catch (error) {
            this.logger.error('[DeliveryReminder] Error running cron job:', error);
        }
    }
};
exports.NotificationCronService = NotificationCronService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationCronService.prototype, "checkUpcomingInvoices", null);
exports.NotificationCronService = NotificationCronService = NotificationCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], NotificationCronService);
//# sourceMappingURL=notification.cron.js.map