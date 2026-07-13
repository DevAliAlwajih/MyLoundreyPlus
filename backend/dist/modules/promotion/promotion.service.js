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
exports.PromotionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PromotionService = class PromotionService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLaundryPromotions(laundryId) {
        const today = new Date();
        const promotions = await this.prisma.promotion.findMany({
            where: {
                laundryId,
                isActive: true,
                OR: [{ startDate: null }, { startDate: { lte: today } }],
                AND: [{ OR: [{ endDate: null }, { endDate: { gte: today } }] }],
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                description: true,
                imageUrl: true,
                startDate: true,
                endDate: true,
                createdAt: true,
            },
        });
        return { success: true, data: promotions };
    }
    async getPromotionDetails(id) {
        const promotion = await this.prisma.promotion.findUnique({
            where: { id },
        });
        if (!promotion) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'PROMOTION_NOT_FOUND', message: 'العرض غير موجود' },
            });
        }
        return { success: true, data: promotion };
    }
    async recordView(promotionId, userId) {
        const promotion = await this.prisma.promotion.findUnique({
            where: { id: promotionId },
        });
        if (!promotion) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'PROMOTION_NOT_FOUND', message: 'العرض غير موجود' },
            });
        }
        if (userId) {
            await this.prisma.promotion_views
                .create({
                data: {
                    promotions: { connect: { id: promotionId } },
                    users: { connect: { id: userId } },
                },
            })
                .catch(() => {
            });
        }
        return { success: true };
    }
    async getMyPromotions(laundryId, dto) {
        const today = new Date();
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const [promotions, total] = await this.prisma.$transaction([
            this.prisma.promotion.findMany({
                where: { laundryId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.promotion.count({ where: { laundryId } }),
        ]);
        const withStats = await Promise.all(promotions.map(async (p) => {
            const viewsCount = await this.prisma.promotion_views.count({
                where: { promotion_id: p.id },
            });
            const isExpired = p.endDate ? new Date(p.endDate) < today : false;
            const isUpcoming = p.startDate ? new Date(p.startDate) > today : false;
            return { ...p, viewsCount, isExpired, isUpcoming };
        }));
        return {
            success: true,
            data: withStats,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async createPromotion(laundryId, dto) {
        if (dto.startDate && dto.endDate) {
            if (new Date(dto.endDate) <= new Date(dto.startDate)) {
                throw new common_1.BadRequestException({
                    success: false,
                    error: { code: 'INVALID_DATE_RANGE', message: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية' },
                });
            }
        }
        const promotion = await this.prisma.promotion.create({
            data: {
                laundry: { connect: { id: laundryId } },
                title: dto.title,
                description: dto.description,
                imageUrl: dto.imageUrl,
                startDate: dto.startDate ? new Date(dto.startDate) : null,
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                isActive: true,
            },
        });
        return { success: true, data: promotion };
    }
    async updatePromotion(laundryId, promotionId, dto) {
        const existing = await this.prisma.promotion.findFirst({
            where: { id: promotionId, laundryId },
        });
        if (!existing) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'PROMOTION_NOT_FOUND', message: 'العرض غير موجود' },
            });
        }
        const startDate = dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : existing.startDate;
        const endDate = dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : existing.endDate;
        if (startDate && endDate && endDate <= startDate) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'INVALID_DATE_RANGE', message: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية' },
            });
        }
        const updated = await this.prisma.promotion.update({
            where: { id: promotionId },
            data: {
                title: dto.title,
                description: dto.description,
                imageUrl: dto.imageUrl,
                startDate: dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : undefined,
                endDate: dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : undefined,
            },
        });
        return { success: true, data: updated };
    }
    async deletePromotion(laundryId, promotionId) {
        const promotion = await this.prisma.promotion.findFirst({
            where: { id: promotionId, laundryId },
        });
        if (!promotion) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'PROMOTION_NOT_FOUND', message: 'العرض غير موجود' },
            });
        }
        await this.prisma.promotion.delete({ where: { id: promotionId } });
        return { success: true, message: 'تم حذف العرض' };
    }
    async togglePromotion(laundryId, promotionId) {
        const promotion = await this.prisma.promotion.findFirst({
            where: { id: promotionId, laundryId },
        });
        if (!promotion) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'PROMOTION_NOT_FOUND', message: 'العرض غير موجود' },
            });
        }
        const updated = await this.prisma.promotion.update({
            where: { id: promotionId },
            data: { isActive: !promotion.isActive },
        });
        return {
            success: true,
            data: { id: promotionId, isActive: updated.isActive },
        };
    }
};
exports.PromotionService = PromotionService;
exports.PromotionService = PromotionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PromotionService);
//# sourceMappingURL=promotion.service.js.map