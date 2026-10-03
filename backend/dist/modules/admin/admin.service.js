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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
const bcrypt = require("bcrypt");
let AdminService = class AdminService {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
    }
    async getLaundries(dto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const where = {
            ...(dto.status ? { status: dto.status } : {}),
            ...(dto.country ? { country: dto.country } : {}),
            ...(dto.search
                ? {
                    name: {
                        contains: dto.search,
                        mode: 'insensitive',
                    },
                }
                : {}),
        };
        const [laundries, total] = await this.prisma.$transaction([
            this.prisma.laundry.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    owner: { select: { fullName: true, email: true, phoneNumber: true } },
                    subscriptions: {
                        where: { isActive: true },
                        take: 1,
                        include: { plan: { select: { nameAr: true } } },
                    },
                    _count: { select: { invoices: true, ratings: true } },
                },
            }),
            this.prisma.laundry.count({ where }),
        ]);
        return {
            success: true,
            data: laundries,
            meta: { total, page, limit },
        };
    }
    async getLaundryDetails(id) {
        const laundry = await this.prisma.laundry.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phoneNumber: true,
                        createdAt: true,
                    },
                },
                subscriptions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    include: { plan: true },
                },
                categories: {
                    where: { isActive: true },
                    include: { items: { where: { isActive: true } } },
                },
                _count: {
                    select: {
                        invoices: true,
                        ratings: true,
                        promotions: true,
                    },
                },
            },
        });
        if (!laundry) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'LAUNDRY_NOT_FOUND', message: 'المغسلة غير موجودة' },
            });
        }
        const totalRevenue = await this.prisma.invoice.aggregate({
            where: { laundryId: id, status: 'completed' },
            _sum: { totalAmount: true },
        });
        return {
            success: true,
            data: {
                ...laundry,
                stats: {
                    totalRevenue: totalRevenue._sum.totalAmount ?? 0,
                },
            },
        };
    }
    async updateLaundryDetails(laundryId, dto) {
        const laundry = await this.prisma.laundry.findUnique({
            where: { id: laundryId },
            select: { id: true },
        });
        if (!laundry) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'LAUNDRY_NOT_FOUND', message: 'المغسلة غير موجودة' },
            });
        }
        const updated = await this.prisma.laundry.update({
            where: { id: laundryId },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.nameAr !== undefined && { nameAr: dto.nameAr }),
                ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
                ...(dto.address !== undefined && { address: dto.address }),
                ...(dto.city !== undefined && { city: dto.city }),
                ...(dto.country !== undefined && { country: dto.country }),
                ...(dto.latitude !== undefined && { latitude: dto.latitude }),
                ...(dto.longitude !== undefined && { longitude: dto.longitude }),
                ...(dto.workingHours !== undefined && { workingHours: dto.workingHours }),
                ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
                ...(dto.tax_enabled !== undefined && { tax_enabled: dto.tax_enabled }),
                ...(dto.tax_rate !== undefined && { tax_rate: dto.tax_rate }),
                ...(dto.urgency_enabled !== undefined && { urgency_enabled: dto.urgency_enabled }),
                ...(dto.urgency_fee !== undefined && { urgency_fee: dto.urgency_fee }),
                updatedAt: new Date(),
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phoneNumber: true,
                        createdAt: true,
                    },
                },
                subscriptions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    include: { plan: true },
                },
                categories: {
                    where: { isActive: true },
                    include: { items: { where: { isActive: true } } },
                },
                _count: {
                    select: {
                        invoices: true,
                        ratings: true,
                        promotions: true,
                    },
                },
            },
        });
        const totalRevenue = await this.prisma.invoice.aggregate({
            where: { laundryId, status: 'completed' },
            _sum: { totalAmount: true },
        });
        return {
            success: true,
            data: {
                ...updated,
                stats: {
                    totalRevenue: totalRevenue._sum.totalAmount ?? 0,
                },
            },
        };
    }
    async updateLaundryOwnerAccount(laundryId, dto) {
        const laundry = await this.prisma.laundry.findUnique({
            where: { id: laundryId },
            select: { id: true, ownerId: true, name: true },
        });
        if (!laundry) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'LAUNDRY_NOT_FOUND', message: 'المغسلة غير موجودة' },
            });
        }
        const normalizedEmail = dto.email?.trim();
        const normalizedPassword = dto.password?.trim();
        const currentOwner = await this.prisma.user.findUnique({
            where: { id: laundry.ownerId },
            select: { id: true, email: true },
        });
        if (!currentOwner) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'OWNER_NOT_FOUND', message: 'مالك المغسلة غير موجود' },
            });
        }
        if (normalizedEmail && normalizedEmail !== currentOwner.email) {
            const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
            if (existing && existing.id !== currentOwner.id) {
                throw new common_1.ForbiddenException({
                    success: false,
                    error: { code: 'EMAIL_ALREADY_IN_USE', message: 'هذا البريد الإلكتروني مستخدم بالفعل' },
                });
            }
        }
        const updateData = {};
        if (normalizedEmail)
            updateData.email = normalizedEmail;
        if (normalizedPassword)
            updateData.password_hash = await bcrypt.hash(normalizedPassword, 10);
        const updated = await this.prisma.user.update({
            where: { id: laundry.ownerId },
            data: updateData,
            select: { id: true, fullName: true, email: true },
        });
        return {
            success: true,
            data: {
                id: updated.id,
                fullName: updated.fullName,
                email: updated.email,
                passwordChanged: !!normalizedPassword,
            },
        };
    }
    async updateLaundryStatus(laundryId, adminId, dto) {
        const laundry = await this.prisma.laundry.findUnique({
            where: { id: laundryId },
            select: { id: true, ownerId: true, name: true },
        });
        if (!laundry) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'LAUNDRY_NOT_FOUND', message: 'المغسلة غير موجودة' },
            });
        }
        await this.prisma.laundry.update({
            where: { id: laundryId },
            data: { status: dto.status },
        });
        const messages = {
            active: { title: 'تم تفعيل مغسلتك ✅', body: 'مغسلتك الآن فعّالة على المنصة' },
            suspended: { title: 'تم تعليق مغسلتك ⚠️', body: dto.reason ?? 'تم تعليق حسابك مؤقتاً' },
            banned: { title: 'تم حظر مغسلتك 🚫', body: dto.reason ?? 'تم حظر حسابك على المنصة' },
            trial: { title: 'بدأت فترتك التجريبية 🎉', body: 'يمكنك الآن استخدام المنصة' },
            pending: { title: 'حسابك قيد المراجعة', body: 'سيتم مراجعة طلبك قريباً' },
        };
        const msg = messages[dto.status];
        if (msg) {
            await this.notificationService.sendToUser(laundry.ownerId, msg.title, msg.body, { type: 'laundry_status_changed' });
        }
        return { success: true, data: { status: dto.status } };
    }
    async updateLaundryBilling(laundryId, dto) {
        const laundry = await this.prisma.laundry.findUnique({
            where: { id: laundryId },
            select: { id: true, name: true },
        });
        if (!laundry) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'LAUNDRY_NOT_FOUND', message: 'المغسلة غير موجودة' },
            });
        }
        const updateData = {};
        if (dto.billing_type !== undefined)
            updateData.billing_type = dto.billing_type;
        if (dto.commission_rate !== undefined)
            updateData.commission_rate = dto.commission_rate;
        if (dto.debt_limit !== undefined)
            updateData.debt_limit = dto.debt_limit;
        if (dto.balance !== undefined)
            updateData.balance = dto.balance;
        if (dto.trial_commission_ends_at !== undefined)
            updateData.trial_commission_ends_at = new Date(dto.trial_commission_ends_at);
        const updated = await this.prisma.laundry.update({
            where: { id: laundryId },
            data: updateData,
            select: {
                id: true,
                name: true,
                billing_type: true,
                commission_rate: true,
                debt_limit: true,
                balance: true,
                trial_commission_ends_at: true,
            },
        });
        return { success: true, data: updated };
    }
    async getLaundryDevices(laundryId) {
        const laundry = await this.prisma.laundry.findUnique({
            where: { id: laundryId },
            select: { ownerId: true },
        });
        if (!laundry) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'LAUNDRY_NOT_FOUND', message: 'المغسلة غير موجودة' },
            });
        }
        return this.getUserDevices(laundry.ownerId);
    }
    async toggleDeviceByLaundryId(laundryId, deviceId, isActive) {
        const laundry = await this.prisma.laundry.findUnique({
            where: { id: laundryId },
            select: { ownerId: true },
        });
        if (!laundry) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'LAUNDRY_NOT_FOUND', message: 'المغسلة غير موجودة' },
            });
        }
        return this.toggleDevice(laundry.ownerId, deviceId, isActive);
    }
    async deleteLaundry(laundryId, adminId, adminPassword) {
        if (!adminPassword) {
            throw new common_1.UnauthorizedException({
                success: false,
                error: { code: 'PASSWORD_REQUIRED', message: 'كلمة المرور مطلوبة لحذف المغسلة' },
            });
        }
        const admin = await this.prisma.user.findUnique({
            where: { id: adminId },
            select: { password_hash: true },
        });
        if (!admin || !admin.password_hash) {
            throw new common_1.UnauthorizedException({
                success: false,
                error: { code: 'INVALID_CREDENTIALS', message: 'تعذر التحقق من هوية المدير' },
            });
        }
        const isMatch = await bcrypt.compare(adminPassword, admin.password_hash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException({
                success: false,
                error: { code: 'INVALID_PASSWORD', message: 'كلمة المرور غير صحيحة' },
            });
        }
        const laundry = await this.prisma.laundry.findUnique({
            where: { id: laundryId },
            select: { id: true, ownerId: true, name: true },
        });
        if (!laundry) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'LAUNDRY_NOT_FOUND', message: 'المغسلة غير موجودة' },
            });
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.invoice.deleteMany({ where: { laundryId } });
            await tx.laundry.delete({ where: { id: laundryId } });
            await tx.user.delete({ where: { id: laundry.ownerId } });
        });
        return { success: true, message: `تم حذف المغسلة "${laundry.name}" وحساب المالك بنجاح` };
    }
    async deleteUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, fullName: true },
        });
        if (!user) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'المستخدم غير موجود' },
            });
        }
        if (user.role === 'admin') {
            throw new common_1.ForbiddenException({
                success: false,
                error: { code: 'CANNOT_DELETE_ADMIN', message: 'لا يمكن حذف حساب أدمن' },
            });
        }
        if (user.role === 'laundry') {
            const laundries = await this.prisma.laundry.findMany({
                where: { ownerId: userId },
                select: { id: true },
            });
            for (const laundry of laundries) {
                await this.prisma.invoice.deleteMany({ where: { laundryId: laundry.id } });
                await this.prisma.laundry.delete({ where: { id: laundry.id } });
            }
        }
        await this.prisma.user.delete({ where: { id: userId } });
        return { success: true, message: `تم حذف المستخدم "${user.fullName}" بنجاح` };
    }
    async getUsers(dto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const where = {
            ...(dto.role ? { role: dto.role } : {}),
            ...(dto.search
                ? {
                    OR: [
                        { fullName: { contains: dto.search, mode: 'insensitive' } },
                        { email: { contains: dto.search, mode: 'insensitive' } },
                        { phoneNumber: { contains: dto.search } },
                    ],
                }
                : {}),
        };
        const [users, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phoneNumber: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    lastLoginAt: true,
                    _count: { select: { userDevices: true } },
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            success: true,
            data: users,
            meta: { total, page, limit },
        };
    }
    async getUserDetails(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        userDevices: true,
                        invoices: true,
                        laundries: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'المستخدم غير موجود' },
            });
        }
        const { password_hash, google_id, deviceToken, ...safeUser } = user;
        return { success: true, data: safeUser };
    }
    async updateUserStatus(userId, adminId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'المستخدم غير موجود' },
            });
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { isActive: dto.isActive },
        });
        if (!dto.isActive) {
            await this.notificationService.sendToUser(userId, 'تم تعطيل حسابك ⚠️', dto.reason ?? 'تم تعطيل حسابك من قبل الإدارة', { type: 'account_disabled' });
        }
        else {
            await this.notificationService.sendToUser(userId, 'تم تفعيل حسابك ✅', 'تم تفعيل حسابك بنجاح', { type: 'account_enabled' });
        }
        return { success: true, data: { isActive: dto.isActive } };
    }
    async getUserDevices(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'المستخدم غير موجود' },
            });
        }
        const devices = await this.prisma.userDevice.findMany({
            where: { userId },
            orderBy: { lastLoginAt: 'desc' },
        });
        return { success: true, data: devices };
    }
    async toggleDevice(userId, deviceId, isActive) {
        const device = await this.prisma.userDevice.findFirst({
            where: { id: deviceId, userId },
        });
        if (!device) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'DEVICE_NOT_FOUND', message: 'الجهاز غير موجود' },
            });
        }
        await this.prisma.userDevice.update({
            where: { id: deviceId },
            data: { isActive, isPrimary: isActive ? device.isPrimary : false },
        });
        return { success: true, data: { deviceId, isActive } };
    }
    async getOverview() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const [totalLaundries, activeLaundries, pendingLaundries, totalUsers, totalInvoices, monthlyRevenue, expiringSubscriptions,] = await this.prisma.$transaction([
            this.prisma.laundry.count(),
            this.prisma.laundry.count({ where: { status: 'active' } }),
            this.prisma.laundry.count({ where: { status: 'pending' } }),
            this.prisma.user.count({ where: { role: 'customer' } }),
            this.prisma.invoice.count({ where: { status: 'completed' } }),
            this.prisma.subscription.aggregate({
                where: {
                    isActive: true,
                    createdAt: { gte: startOfMonth },
                },
                _sum: { amountPaid: true },
            }),
            this.prisma.subscription.count({
                where: {
                    isActive: true,
                    endDate: {
                        gte: today,
                        lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);
        return {
            success: true,
            data: {
                laundries: {
                    total: totalLaundries,
                    active: activeLaundries,
                    pending: pendingLaundries,
                },
                users: { total: totalUsers },
                invoices: { completed: totalInvoices },
                revenue: {
                    thisMonth: monthlyRevenue._sum.amountPaid ?? 0,
                },
                alerts: {
                    expiringSubscriptions,
                },
            },
        };
    }
    async getRevenueAnalytics() {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const start = new Date(date.getFullYear(), date.getMonth(), 1);
            const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            const revenue = await this.prisma.subscription.aggregate({
                where: { createdAt: { gte: start, lte: end }, isActive: true },
                _sum: { amountPaid: true },
            });
            months.push({
                month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
                revenue: revenue._sum.amountPaid ?? 0,
            });
        }
        return { success: true, data: months };
    }
    async getTopLaundries() {
        try {
            const result = await this.prisma.$queryRaw `SELECT * FROM v_top_laundries LIMIT 10`;
            return { success: true, data: result };
        }
        catch (e) {
            return { success: false, data: [], error: 'v_top_laundries view might not exist' };
        }
    }
    async getSettings() {
        const settings = await this.prisma.app_settings.findMany({
            orderBy: { key: 'asc' },
        });
        const settingsObj = settings.reduce((acc, s) => {
            acc[s.key] = { value: s.value, description: s.description };
            return acc;
        }, {});
        return { success: true, data: settingsObj };
    }
    async updateSetting(key, value, adminId) {
        const setting = await this.prisma.app_settings.upsert({
            where: { key },
            update: { value, updated_by: adminId },
            create: { key, value, updated_by: adminId },
        });
        return { success: true, data: setting };
    }
    async addBalance(laundryId, adminId, dto) {
        if (!dto.amount || dto.amount <= 0) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'INVALID_AMOUNT', message: 'المبلغ يجب أن يكون أكبر من صفر' },
            });
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const laundry = await tx.laundry.findUnique({
                where: { id: laundryId },
                select: { id: true, name: true, nameAr: true, balance: true, ownerId: true },
            });
            if (!laundry) {
                throw new common_1.NotFoundException({
                    success: false,
                    error: { code: 'LAUNDRY_NOT_FOUND', message: 'المغسلة غير موجودة' },
                });
            }
            const balanceBefore = Number(laundry.balance);
            const balanceAfter = balanceBefore + dto.amount;
            await tx.laundry.update({
                where: { id: laundryId },
                data: { balance: balanceAfter },
            });
            await tx.$executeRaw `
        INSERT INTO wallet_recharges
          (id, laundry_id, amount, balance_before, balance_after, payment_method, reference_number, notes, created_by, created_at)
        VALUES
          (uuid_generate_v4(), ${laundryId}::uuid, ${dto.amount}, ${balanceBefore}, ${balanceAfter},
           ${(dto.payment_method ?? 'cash')}::"payment_method_type",
           ${dto.reference_number ?? null}, ${dto.notes ?? null},
           ${adminId}::uuid, NOW())
      `;
            return {
                laundryId,
                laundryName: laundry.nameAr || laundry.name,
                balanceBefore,
                balanceAfter,
                amount: dto.amount,
                payment_method: dto.payment_method ?? 'cash',
                reference_number: dto.reference_number,
                notes: dto.notes,
            };
        });
        try {
            const laundry = await this.prisma.laundry.findUnique({
                where: { id: laundryId },
                select: { ownerId: true },
            });
            if (laundry?.ownerId) {
                await this.notificationService.sendToUser(laundry.ownerId, 'تم شحن رصيدك 💰', `تم إضافة ${dto.amount} ريال إلى رصيد مغسلتك. الرصيد الحالي: ${result.balanceAfter} ريال`, { type: 'wallet_recharge', data: { amount: String(dto.amount) } });
            }
        }
        catch (e) {
        }
        return { success: true, message: 'تم شحن الرصيد بنجاح', data: result };
    }
    async getBalanceHistory(laundryId, query) {
        const limit = query?.limit ? Number(query.limit) : 50;
        const offset = query?.offset ? Number(query.offset) : 0;
        const laundry = await this.prisma.laundry.findUnique({
            where: { id: laundryId },
            select: { id: true, name: true, nameAr: true, balance: true },
        });
        if (!laundry) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'LAUNDRY_NOT_FOUND', message: 'المغسلة غير موجودة' },
            });
        }
        const records = await this.prisma.$queryRaw `
      SELECT
        wr.id,
        wr.amount,
        wr.balance_before,
        wr.balance_after,
        wr.payment_method,
        wr.reference_number,
        wr.notes,
        wr.created_at,
        u.full_name AS admin_name
      FROM wallet_recharges wr
      LEFT JOIN users u ON u.id = wr.created_by
      WHERE wr.laundry_id = ${laundryId}::uuid
      ORDER BY wr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
        const countResult = await this.prisma.$queryRaw `
      SELECT COUNT(*)::int AS total FROM wallet_recharges WHERE laundry_id = ${laundryId}::uuid
    `;
        const totalRechargedResult = await this.prisma.$queryRaw `
      SELECT COALESCE(SUM(amount), 0)::float AS total FROM wallet_recharges WHERE laundry_id = ${laundryId}::uuid
    `;
        return {
            success: true,
            data: {
                laundryId,
                laundryName: laundry.nameAr || laundry.name,
                currentBalance: Number(laundry.balance),
                totalRecharged: Number(totalRechargedResult[0]?.total ?? 0),
                total: Number(countResult[0]?.total ?? 0),
                records: records.map((r) => ({
                    id: r.id,
                    amount: Number(r.amount),
                    balanceBefore: Number(r.balance_before),
                    balanceAfter: Number(r.balance_after),
                    paymentMethod: r.payment_method,
                    referenceNumber: r.reference_number,
                    notes: r.notes,
                    adminName: r.admin_name,
                    createdAt: r.created_at,
                })),
            },
        };
    }
    async getAllRecharges(query) {
        const limit = query?.limit ? Number(query.limit) : 50;
        const offset = query?.offset ? Number(query.offset) : 0;
        const laundryId = query?.laundryId;
        const search = query?.search ? `%${query.search}%` : null;
        let records;
        let countResult;
        let totalSumResult;
        if (laundryId) {
            records = await this.prisma.$queryRaw `
        SELECT
          wr.id,
          wr.laundry_id,
          wr.amount,
          wr.balance_before,
          wr.balance_after,
          wr.payment_method,
          wr.reference_number,
          wr.notes,
          wr.created_at,
          l.name AS laundry_name,
          l.name_ar AS laundry_name_ar,
          l.phone_number AS laundry_phone,
          u.full_name AS admin_name
        FROM wallet_recharges wr
        JOIN laundries l ON l.id = wr.laundry_id
        LEFT JOIN users u ON u.id = wr.created_by
        WHERE wr.laundry_id = ${laundryId}::uuid
        ORDER BY wr.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
            countResult = await this.prisma.$queryRaw `
        SELECT COUNT(*)::int AS total FROM wallet_recharges WHERE laundry_id = ${laundryId}::uuid
      `;
            totalSumResult = await this.prisma.$queryRaw `
        SELECT COALESCE(SUM(amount), 0)::float AS total FROM wallet_recharges WHERE laundry_id = ${laundryId}::uuid
      `;
        }
        else if (search) {
            records = await this.prisma.$queryRaw `
        SELECT
          wr.id,
          wr.laundry_id,
          wr.amount,
          wr.balance_before,
          wr.balance_after,
          wr.payment_method,
          wr.reference_number,
          wr.notes,
          wr.created_at,
          l.name AS laundry_name,
          l.name_ar AS laundry_name_ar,
          l.phone_number AS laundry_phone,
          u.full_name AS admin_name
        FROM wallet_recharges wr
        JOIN laundries l ON l.id = wr.laundry_id
        LEFT JOIN users u ON u.id = wr.created_by
        WHERE (l.name ILIKE ${search} OR l.name_ar ILIKE ${search} OR wr.reference_number ILIKE ${search} OR wr.notes ILIKE ${search})
        ORDER BY wr.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
            countResult = await this.prisma.$queryRaw `
        SELECT COUNT(*)::int AS total
        FROM wallet_recharges wr
        JOIN laundries l ON l.id = wr.laundry_id
        WHERE (l.name ILIKE ${search} OR l.name_ar ILIKE ${search} OR wr.reference_number ILIKE ${search} OR wr.notes ILIKE ${search})
      `;
            totalSumResult = await this.prisma.$queryRaw `
        SELECT COALESCE(SUM(wr.amount), 0)::float AS total
        FROM wallet_recharges wr
        JOIN laundries l ON l.id = wr.laundry_id
        WHERE (l.name ILIKE ${search} OR l.name_ar ILIKE ${search} OR wr.reference_number ILIKE ${search} OR wr.notes ILIKE ${search})
      `;
        }
        else {
            records = await this.prisma.$queryRaw `
        SELECT
          wr.id,
          wr.laundry_id,
          wr.amount,
          wr.balance_before,
          wr.balance_after,
          wr.payment_method,
          wr.reference_number,
          wr.notes,
          wr.created_at,
          l.name AS laundry_name,
          l.name_ar AS laundry_name_ar,
          l.phone_number AS laundry_phone,
          u.full_name AS admin_name
        FROM wallet_recharges wr
        JOIN laundries l ON l.id = wr.laundry_id
        LEFT JOIN users u ON u.id = wr.created_by
        ORDER BY wr.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
            countResult = await this.prisma.$queryRaw `
        SELECT COUNT(*)::int AS total FROM wallet_recharges
      `;
            totalSumResult = await this.prisma.$queryRaw `
        SELECT COALESCE(SUM(amount), 0)::float AS total FROM wallet_recharges
      `;
        }
        return {
            success: true,
            data: {
                total: Number(countResult[0]?.total ?? 0),
                totalRechargedSum: Number(totalSumResult[0]?.total ?? 0),
                records: records.map((r) => ({
                    id: r.id,
                    laundryId: r.laundry_id,
                    laundryName: r.laundry_name_ar || r.laundry_name,
                    laundryPhone: r.laundry_phone,
                    amount: Number(r.amount),
                    balanceBefore: Number(r.balance_before),
                    balanceAfter: Number(r.balance_after),
                    paymentMethod: r.payment_method,
                    referenceNumber: r.reference_number,
                    notes: r.notes,
                    adminName: r.admin_name,
                    createdAt: r.created_at,
                })),
            },
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], AdminService);
//# sourceMappingURL=admin.service.js.map