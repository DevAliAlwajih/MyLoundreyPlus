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
exports.AdsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AdsService = class AdsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getActiveAds(userRole, audienceQuery) {
        const today = new Date();
        const audience = audienceQuery
            ? audienceQuery
            : userRole === 'laundry'
                ? 'laundries'
                : 'customers';
        const ads = await this.prisma.ad.findMany({
            where: {
                isActive: true,
                targetAudience: { in: ['all', audience] },
                OR: [{ startDate: null }, { startDate: { lte: today } }],
                AND: [
                    {
                        OR: [{ endDate: null }, { endDate: { gte: today } }],
                    },
                ],
            },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
            select: {
                id: true,
                title: true,
                mediaUrls: true,
                bodyText: true,
                linkUrl: true,
                targetAudience: true,
                adFee: true,
                startDate: true,
                endDate: true,
            },
        });
        return { success: true, data: ads };
    }
    async getAdDetails(id) {
        const ad = await this.prisma.ad.findUnique({
            where: { id, isActive: true },
        });
        if (!ad) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'AD_NOT_FOUND', message: 'الإعلان غير موجود أو غير نشط' },
            });
        }
        return { success: true, data: ad };
    }
    async recordView(adId, userId) {
        const ad = await this.prisma.ad.findUnique({
            where: { id: adId, isActive: true },
        });
        if (!ad) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'AD_NOT_FOUND', message: 'الإعلان غير موجود' },
            });
        }
        if (userId) {
            await this.prisma.promotion_views
                .create({
                data: {
                    ads: { connect: { id: adId } },
                    users: { connect: { id: userId } },
                },
            })
                .catch(() => {
            });
        }
        return { success: true };
    }
    async createAd(adminId, dto) {
        const ad = await this.prisma.ad.create({
            data: {
                title: dto.title,
                mediaUrls: dto.mediaUrls,
                bodyText: dto.bodyText,
                linkUrl: dto.linkUrl,
                targetAudience: dto.targetAudience ?? 'all',
                adFee: dto.adFee ?? 0,
                sortOrder: dto.sortOrder ?? 0,
                startDate: dto.startDate ? new Date(dto.startDate) : null,
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                isActive: true,
                creator: { connect: { id: adminId } },
            },
        });
        return { success: true, data: ad };
    }
    async updateAd(id, dto) {
        const existing = await this.prisma.ad.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'AD_NOT_FOUND', message: 'الإعلان غير موجود' },
            });
        }
        const dataToUpdate = { ...dto };
        if (dto.startDate)
            dataToUpdate.startDate = new Date(dto.startDate);
        if (dto.endDate)
            dataToUpdate.endDate = new Date(dto.endDate);
        if (dto.targetAudience)
            dataToUpdate.targetAudience = dto.targetAudience;
        const updatedAd = await this.prisma.ad.update({
            where: { id },
            data: dataToUpdate,
        });
        return { success: true, data: updatedAd };
    }
    async deleteAd(id) {
        const ad = await this.prisma.ad.findUnique({ where: { id } });
        if (!ad) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'AD_NOT_FOUND', message: 'الإعلان غير موجود' },
            });
        }
        await this.prisma.ad.delete({ where: { id } });
        return { success: true, message: 'تم حذف الإعلان بنجاح' };
    }
    async toggleAd(id) {
        const ad = await this.prisma.ad.findUnique({ where: { id } });
        if (!ad) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'AD_NOT_FOUND', message: 'الإعلان غير موجود' },
            });
        }
        const updated = await this.prisma.ad.update({
            where: { id },
            data: { isActive: !ad.isActive },
        });
        return {
            success: true,
            data: { id, isActive: updated.isActive },
        };
    }
    async getAllAdsForAdmin(dto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const [ads, total] = await this.prisma.$transaction([
            this.prisma.ad.findMany({
                orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.ad.count(),
        ]);
        const adsWithViews = await Promise.all(ads.map(async (ad) => {
            const views = await this.prisma.promotion_views.count({
                where: { ad_id: ad.id },
            });
            return { ...ad, viewsCount: views };
        }));
        return {
            success: true,
            data: adsWithViews,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
};
exports.AdsService = AdsService;
exports.AdsService = AdsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdsService);
//# sourceMappingURL=ads.service.js.map