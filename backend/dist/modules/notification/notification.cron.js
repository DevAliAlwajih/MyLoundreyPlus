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
        this.logger.log('Running daily cron job for upcoming invoice deliveries...');
        const tomorrowStart = new Date();
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setHours(23, 59, 59, 999);
        try {
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
            for (const invoice of upcomingInvoices) {
                await this.notificationService.sendToLaundryOwner(invoice.laundryId, 'اقتراب موعد التسليم ⏰', `تذكير: الفاتورة رقم ${invoice.invoiceNumber} موعد تسليمها غداً.`, { type: 'invoice_delivery_soon', referenceId: invoice.id });
            }
            this.logger.log('Successfully sent delivery reminders.');
        }
        catch (error) {
            this.logger.error('Error running invoice delivery cron job:', error);
        }
    }
};
exports.NotificationCronService = NotificationCronService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_9AM),
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