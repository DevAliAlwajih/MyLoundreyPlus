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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
const MESSAGE_SELECT = {
    id: true,
    message: true,
    attachment_url: true,
    attachment_type: true,
    is_read: true,
    sent_at: true,
    sender_id: true,
    users_chat_messages_sender_idTousers: {
        select: { fullName: true, avatarUrl: true, role: true },
    },
};
let ChatService = class ChatService {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
    }
    async getCustomerMessages(customerId, laundryId, dto) {
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
        const { page = 1, limit = 50, before } = dto;
        const where = {
            laundry_id: laundryId,
            customer_id: customerId,
            admin_id: null,
        };
        if (before) {
            where.sent_at = { lt: new Date(before) };
        }
        const messages = await this.prisma.chat_messages.findMany({
            where,
            orderBy: { sent_at: 'desc' },
            take: limit,
            skip: (page - 1) * limit,
            select: MESSAGE_SELECT,
        });
        return {
            success: true,
            data: messages.reverse(),
        };
    }
    async sendMessageToLaundry(customerId, laundryId, dto) {
        if (!dto.message && !dto.attachmentUrl) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'EMPTY_MESSAGE', message: 'يجب إرسال نص أو مرفق' },
            });
        }
        const laundry = await this.prisma.laundry.findFirst({
            where: { id: laundryId, status: { in: ['active', 'trial'] } },
            select: { id: true, ownerId: true },
        });
        if (!laundry) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'LAUNDRY_NOT_FOUND', message: 'المغسلة غير موجودة أو غير فعّالة' },
            });
        }
        const msg = await this.prisma.chat_messages.create({
            data: {
                laundries: { connect: { id: laundryId } },
                users_chat_messages_customer_idTousers: { connect: { id: customerId } },
                users_chat_messages_sender_idTousers: { connect: { id: customerId } },
                message: dto.message,
                attachment_url: dto.attachmentUrl,
                attachment_type: dto.attachmentType,
            },
        });
        this.notificationService
            .sendToUser(laundry.ownerId, 'رسالة جديدة 💬', dto.message ?? 'أرسل لك مرفقاً', { type: 'new_message', referenceId: msg.id })
            .catch((err) => console.error('Notification error:', err));
        return { success: true, data: msg };
    }
    async markAsRead(customerId, laundryId) {
        await this.prisma.chat_messages.updateMany({
            where: {
                laundry_id: laundryId,
                customer_id: customerId,
                admin_id: null,
                sender_id: { not: customerId },
                is_read: false,
            },
            data: { is_read: true },
        });
        return { success: true, message: 'تم تحديث حالة القراءة' };
    }
    async getLaundryMessages(laundryId, customerId, dto) {
        const { page = 1, limit = 50, before } = dto;
        const where = {
            laundry_id: laundryId,
            customer_id: customerId,
            admin_id: null,
        };
        if (before) {
            where.sent_at = { lt: new Date(before) };
        }
        const messages = await this.prisma.chat_messages.findMany({
            where,
            orderBy: { sent_at: 'desc' },
            take: limit,
            skip: (page - 1) * limit,
            select: MESSAGE_SELECT,
        });
        return {
            success: true,
            data: messages.reverse(),
        };
    }
    async sendMessageToCustomer(laundryId, customerId, dto) {
        if (!dto.message && !dto.attachmentUrl) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'EMPTY_MESSAGE', message: 'يجب إرسال نص أو مرفق' },
            });
        }
        const customer = await this.prisma.user.findUnique({
            where: { id: customerId },
            select: { id: true },
        });
        if (!customer) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'CUSTOMER_NOT_FOUND', message: 'العميل غير موجود' },
            });
        }
        const laundry = await this.prisma.laundry.findUnique({
            where: { id: laundryId },
            select: { ownerId: true },
        });
        const msg = await this.prisma.chat_messages.create({
            data: {
                laundries: { connect: { id: laundryId } },
                users_chat_messages_customer_idTousers: { connect: { id: customerId } },
                users_chat_messages_sender_idTousers: { connect: { id: laundry.ownerId } },
                message: dto.message,
                attachment_url: dto.attachmentUrl,
                attachment_type: dto.attachmentType,
            },
        });
        this.notificationService
            .sendToUser(customerId, 'رسالة من المغسلة 💬', dto.message ?? 'أرسلت لك مرفقاً', { type: 'new_message', referenceId: msg.id })
            .catch((err) => console.error('Notification error:', err));
        return { success: true, data: msg };
    }
    async markAsReadByLaundry(laundryId, customerId) {
        const laundry = await this.prisma.laundry.findUnique({
            where: { id: laundryId },
            select: { ownerId: true },
        });
        await this.prisma.chat_messages.updateMany({
            where: {
                laundry_id: laundryId,
                customer_id: customerId,
                admin_id: null,
                sender_id: { not: laundry.ownerId },
                is_read: false,
            },
            data: { is_read: true },
        });
        return { success: true, message: 'تم تحديث حالة القراءة' };
    }
    async sendMessageToSupport(senderId, senderRole, dto) {
        if (!dto.message && !dto.attachmentUrl) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'EMPTY_MESSAGE', message: 'يجب إرسال نص أو مرفق' },
            });
        }
        const admin = await this.prisma.user.findFirst({
            where: { role: 'admin' },
            select: { id: true },
        });
        if (!admin) {
            throw new common_1.ServiceUnavailableException({
                success: false,
                error: { code: 'SUPPORT_UNAVAILABLE', message: 'الدعم الفني غير متاح حالياً' },
            });
        }
        const data = {
            users_chat_messages_sender_idTousers: { connect: { id: senderId } },
            users_chat_messages_admin_idTousers: { connect: { id: admin.id } },
            message: dto.message,
            attachment_url: dto.attachmentUrl,
            attachment_type: dto.attachmentType,
        };
        if (senderRole === 'customer') {
            data.users_chat_messages_customer_idTousers = { connect: { id: senderId } };
        }
        else if (senderRole === 'laundry') {
            const laundry = await this.prisma.laundry.findFirst({
                where: { ownerId: senderId },
                select: { id: true },
            });
            if (laundry) {
                data.laundries = { connect: { id: laundry.id } };
            }
        }
        const msg = await this.prisma.chat_messages.create({ data });
        this.notificationService
            .sendToUser(admin.id, 'رسالة دعم فني جديدة 🔔', dto.message ?? 'مرفق جديد', { type: 'support_message', referenceId: msg.id })
            .catch((err) => console.error('Notification error:', err));
        return { success: true, data: msg };
    }
    async getSupportMessages(senderId, senderRole, dto) {
        const { page = 1, limit = 50, before } = dto;
        const where = {
            admin_id: { not: null },
        };
        if (senderRole === 'customer') {
            where.customer_id = senderId;
        }
        else if (senderRole === 'laundry') {
            const laundry = await this.prisma.laundry.findFirst({
                where: { ownerId: senderId },
                select: { id: true },
            });
            where.laundry_id = laundry?.id ?? null;
        }
        if (before) {
            where.sent_at = { lt: new Date(before) };
        }
        const messages = await this.prisma.chat_messages.findMany({
            where,
            orderBy: { sent_at: 'desc' },
            take: limit,
            skip: (page - 1) * limit,
            select: MESSAGE_SELECT,
        });
        return {
            success: true,
            data: messages.reverse(),
        };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], ChatService);
//# sourceMappingURL=chat.service.js.map