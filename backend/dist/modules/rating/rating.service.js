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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
let RatingService = class RatingService {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
    }
    async createRating(customerId, dto) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: dto.invoiceId },
            select: { id: true, customerId: true, laundryId: true, status: true },
        });
        if (!invoice) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'INVOICE_NOT_FOUND', message: 'الفاتورة غير موجودة' },
            });
        }
        if (invoice.status !== 'completed') {
            throw new common_1.UnprocessableEntityException({
                success: false,
                error: {
                    code: 'INVOICE_NOT_COMPLETED',
                    message: 'لا يمكن التقييم إلا بعد اكتمال الفاتورة',
                },
            });
        }
        if (invoice.customerId !== customerId) {
            throw new common_1.ForbiddenException({
                success: false,
                error: { code: 'RATING_FORBIDDEN', message: 'لا يمكنك تقييم فاتورة لا تخصك' },
            });
        }
        const existing = await this.prisma.rating.findUnique({
            where: { invoiceId: dto.invoiceId },
        });
        if (existing) {
            throw new common_1.ConflictException({
                success: false,
                error: {
                    code: 'ALREADY_RATED',
                    message: 'لقد قيّمت هذه الفاتورة مسبقاً',
                },
            });
        }
        const rating = await this.prisma.rating.create({
            data: {
                invoice: { connect: { id: dto.invoiceId } },
                customer: { connect: { id: customerId } },
                laundry: { connect: { id: invoice.laundryId } },
                stars: dto.stars,
                comment: dto.comment,
            },
        });
        const starsIcon = '⭐'.repeat(dto.stars);
        this.notificationService
            .sendToLaundryOwner(invoice.laundryId, `تقييم جديد ${starsIcon}`, dto.comment ? `"${dto.comment}"` : `حصلت على تقييم ${dto.stars} نجوم`, { type: 'new_rating', referenceId: rating.id })
            .catch((err) => console.error('Notification error:', err));
        return { success: true, data: rating };
    }
    async canRate(customerId, invoiceId) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            select: { customerId: true, status: true },
        });
        if (!invoice || invoice.customerId !== customerId) {
            return { success: true, data: { canRate: false, reason: 'الفاتورة غير موجودة' } };
        }
        if (invoice.status !== 'completed') {
            return { success: true, data: { canRate: false, reason: 'الفاتورة لم تكتمل بعد' } };
        }
        const existing = await this.prisma.rating.findUnique({
            where: { invoiceId },
        });
        if (existing) {
            return {
                success: true,
                data: { canRate: false, reason: 'قيّمت مسبقاً', existingRating: existing },
            };
        }
        return { success: true, data: { canRate: true } };
    }
    async getLaundryRatings(laundryId, dto) {
        const { page = 1, limit = 20, stars } = dto;
        const where = { laundryId };
        if (stars)
            where.stars = stars;
        const [ratings, total, laundry] = await this.prisma.$transaction([
            this.prisma.rating.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    stars: true,
                    comment: true,
                    createdAt: true,
                    customer: { select: { fullName: true, avatarUrl: true } },
                },
            }),
            this.prisma.rating.count({ where }),
            this.prisma.laundry.findUnique({
                where: { id: laundryId },
                select: { ratingAvg: true, ratingCount: true },
            }),
        ]);
        const distribution = await this.prisma.rating.groupBy({
            by: ['stars'],
            where: { laundryId },
            _count: true,
        });
        const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        distribution.forEach((d) => {
            dist[d.stars] = d._count;
        });
        return {
            success: true,
            data: {
                summary: {
                    ratingAvg: laundry?.ratingAvg !== null ? Number(laundry?.ratingAvg) : 0,
                    ratingCount: laundry?.ratingCount ?? 0,
                    distribution: dist,
                },
                reviews: ratings,
            },
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getMyRatings(customerId) {
        const ratings = await this.prisma.rating.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                stars: true,
                comment: true,
                createdAt: true,
                laundry: { select: { id: true, name: true, logoUrl: true } },
                invoice: { select: { invoiceNumber: true } },
            },
        });
        return { success: true, data: ratings };
    }
};
exports.RatingService = RatingService;
exports.RatingService = RatingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], RatingService);
//# sourceMappingURL=rating.service.js.map