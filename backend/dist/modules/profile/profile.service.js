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
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = require("bcrypt");
let ProfileService = class ProfileService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                uniqueId: true,
                qrCode: true,
                avatarUrl: true,
                role: true,
                country: true,
                currency: true,
                isVerified: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'PROFILE_NOT_FOUND', message: 'المستخدم غير موجود' },
            });
        }
        return { success: true, data: user };
    }
    async updateProfile(userId, dto) {
        if (dto.phoneNumber) {
            const existing = await this.prisma.user.findUnique({
                where: { phoneNumber: dto.phoneNumber },
            });
            if (existing && existing.id !== userId) {
                throw new common_1.ConflictException({
                    success: false,
                    error: { code: 'PHONE_ALREADY_EXISTS', message: 'رقم الهاتف مستخدم مسبقاً' },
                });
            }
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(dto.fullName !== undefined && { fullName: dto.fullName }),
                ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
                ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
                ...(dto.country !== undefined && { country: dto.country }),
                ...(dto.currency !== undefined && { currency: dto.currency }),
                updatedAt: new Date(),
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                uniqueId: true,
                qrCode: true,
                avatarUrl: true,
                role: true,
                country: true,
                currency: true,
                isVerified: true,
                createdAt: true,
            },
        });
        return { success: true, data: updated };
    }
    async updatePassword(userId, dto) {
        if (dto.newPassword !== dto.confirmPassword) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'PASSWORD_MISMATCH', message: 'كلمة المرور الجديدة وتأكيدها غير متطابقَين' },
            });
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { password_hash: true },
        });
        if (!user) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'PROFILE_NOT_FOUND', message: 'المستخدم غير موجود' },
            });
        }
        if (!user.password_hash) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'GOOGLE_ACCOUNT_NO_PASSWORD', message: 'حسابك مرتبط بـ Google — لا يوجد كلمة مرور' },
            });
        }
        const isMatch = await bcrypt.compare(dto.currentPassword, user.password_hash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException({
                success: false,
                error: { code: 'WRONG_CURRENT_PASSWORD', message: 'كلمة المرور الحالية غير صحيحة' },
            });
        }
        const hash = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password_hash: hash },
        });
        return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
    }
    async getDevices(userId) {
        const devices = await this.prisma.userDevice.findMany({
            where: { userId },
            select: {
                id: true,
                device_name: true,
                deviceModel: true,
                deviceOs: true,
                deviceType: true,
                isPrimary: true,
                isActive: true,
                lastLoginAt: true,
            },
            orderBy: { lastLoginAt: 'desc' },
        });
        return { success: true, data: devices };
    }
    async deactivateDevice(userId, deviceId) {
        const device = await this.prisma.userDevice.findFirst({
            where: { id: deviceId, userId },
        });
        if (!device) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'DEVICE_NOT_FOUND', message: 'الجهاز غير موجود' },
            });
        }
        if (device.isPrimary) {
            const activeCount = await this.prisma.userDevice.count({
                where: { userId, isActive: true },
            });
            if (activeCount === 1) {
                throw new common_1.BadRequestException({
                    success: false,
                    error: { code: 'CANNOT_DEACTIVATE_LAST', message: 'لا يمكن إلغاء جهازك الوحيد النشط' },
                });
            }
        }
        await this.prisma.userDevice.update({
            where: { id: deviceId },
            data: { isActive: false, isPrimary: false },
        });
        return { success: true, message: 'تم إلغاء تفعيل الجهاز' };
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfileService);
//# sourceMappingURL=profile.service.js.map