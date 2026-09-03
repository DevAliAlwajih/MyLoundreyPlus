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
            where: { id: laundryId, status: { not: 'banned' } },
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
        const data = {
            users_chat_messages_sender_idTousers: { connect: { id: senderId } },
            message: dto.message,
            attachment_url: dto.attachmentUrl,
            attachment_type: dto.attachmentType,
        };
        if (admin) {
            data.users_chat_messages_admin_idTousers = { connect: { id: admin.id } };
        }
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
        if (admin) {
            this.notificationService
                .sendToUser(admin.id, 'رسالة دعم فني جديدة 🔔', dto.message ?? 'مرفق جديد', { type: 'support_message', referenceId: msg.id })
                .catch((err) => console.error('Notification error:', err));
        }
        return { success: true, data: msg };
    }
    async getLaundryConversations(laundryId) {
        const laundry = await this.prisma.laundry.findUnique({
            where: { id: laundryId },
            select: { ownerId: true },
        });
        if (!laundry) {
            throw new common_1.NotFoundException('Laundry not found');
        }
        const messages = await this.prisma.chat_messages.findMany({
            where: { laundry_id: laundryId, admin_id: null, customer_id: { not: null } },
            orderBy: { sent_at: 'desc' },
            distinct: ['customer_id'],
            select: {
                id: true,
                message: true,
                attachment_url: true,
                attachment_type: true,
                is_read: true,
                sent_at: true,
                customer_id: true,
                sender_id: true,
                users_chat_messages_customer_idTousers: {
                    select: {
                        id: true,
                        fullName: true,
                        phoneNumber: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        const unreads = await this.prisma.chat_messages.groupBy({
            by: ['customer_id'],
            where: {
                laundry_id: laundryId,
                admin_id: null,
                is_read: false,
                sender_id: { not: laundry.ownerId },
            },
            _count: { id: true },
        });
        const unreadMap = new Map(unreads.map((u) => [u.customer_id, u._count.id]));
        return {
            success: true,
            data: messages.map((msg) => {
                const user = msg.users_chat_messages_customer_idTousers;
                return {
                    id: msg.customer_id,
                    customer: {
                        id: msg.customer_id,
                        fullName: user?.fullName || user?.phoneNumber || 'عميل مجهول',
                        avatarUrl: user?.avatarUrl,
                    },
                    lastMessage: {
                        id: msg.id,
                        message: msg.message,
                        attachmentUrl: msg.attachment_url,
                        attachmentType: msg.attachment_type,
                        isRead: msg.is_read,
                        sentAt: msg.sent_at,
                        senderId: msg.sender_id,
                    },
                    unreadCount: unreadMap.get(msg.customer_id) || 0,
                };
            }),
        };
    }
    async getSupportMessages(senderId, senderRole, dto) {
        const { page = 1, limit = 50, before } = dto;
        const where = {};
        if (senderRole === 'customer') {
            where.customer_id = senderId;
            where.laundry_id = null;
        }
        else if (senderRole === 'laundry') {
            const laundry = await this.prisma.laundry.findFirst({
                where: { ownerId: senderId },
                select: { id: true },
            });
            if (laundry) {
                where.laundry_id = laundry.id;
                where.customer_id = null;
            }
            else {
                return { success: true, data: [] };
            }
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
    async deleteMessage(messageId, requesterId) {
        const message = await this.prisma.chat_messages.findUnique({
            where: { id: messageId },
            select: { id: true, sender_id: true },
        });
        if (!message) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'MESSAGE_NOT_FOUND', message: 'الرسالة غير موجودة' },
            });
        }
        if (message.sender_id !== requesterId) {
            throw new common_1.ForbiddenException({
                success: false,
                error: { code: 'NOT_YOUR_MESSAGE', message: 'لا يمكنك حذف رسالة لم ترسلها' },
            });
        }
        await this.prisma.chat_messages.delete({ where: { id: messageId } });
        return { success: true, message: 'تم حذف الرسالة' };
    }
    async getAdminSupportConversations() {
        const messages = await this.prisma.chat_messages.findMany({
            where: {
                OR: [
                    { customer_id: { not: null }, laundry_id: null },
                    { laundry_id: { not: null }, customer_id: null }
                ]
            },
            orderBy: { sent_at: 'desc' },
            include: {
                users_chat_messages_customer_idTousers: { select: { id: true, fullName: true, avatarUrl: true, phoneNumber: true } },
                laundries: { select: { id: true, name: true, logoUrl: true, ownerId: true } },
            }
        });
        const conversationsMap = new Map();
        const unreadMap = new Map();
        messages.forEach((msg) => {
            const isCustomer = !!msg.customer_id;
            const targetId = isCustomer ? msg.customer_id : msg.laundry_id;
            const type = isCustomer ? 'customer' : 'laundry';
            const key = `${type}_${targetId}`;
            const isFromAdmin = msg.admin_id === msg.sender_id && msg.admin_id !== null;
            if (!isFromAdmin && !msg.is_read) {
                unreadMap.set(key, (unreadMap.get(key) || 0) + 1);
            }
            if (!conversationsMap.has(key)) {
                conversationsMap.set(key, {
                    id: key,
                    targetId,
                    type,
                    from: isCustomer
                        ? (msg.users_chat_messages_customer_idTousers?.fullName || msg.users_chat_messages_customer_idTousers?.phoneNumber || 'عميل مجهول')
                        : (msg.laundries?.name || 'مغسلة مجهولة'),
                    avatar: isCustomer ? msg.users_chat_messages_customer_idTousers?.avatarUrl : msg.laundries?.logoUrl,
                    lastMessage: {
                        id: msg.id,
                        message: msg.message,
                        attachmentUrl: msg.attachment_url,
                        attachmentType: msg.attachment_type,
                        isRead: msg.is_read,
                        sentAt: msg.sent_at,
                    }
                });
            }
        });
        return {
            success: true,
            data: Array.from(conversationsMap.values()).map(c => ({
                ...c,
                unreadCount: unreadMap.get(c.id) || 0
            }))
        };
    }
    async getAdminSupportMessages(type, targetId, dto) {
        const { page = 1, limit = 50, before } = dto;
        const where = {};
        if (type === 'customer') {
            where.customer_id = targetId;
            where.laundry_id = null;
        }
        else {
            where.laundry_id = targetId;
            where.customer_id = null;
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
    async sendMessageFromAdmin(adminId, type, targetId, dto) {
        if (!dto.message && !dto.attachmentUrl) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'EMPTY_MESSAGE', message: 'يجب إرسال نص أو مرفق' },
            });
        }
        const data = {
            users_chat_messages_sender_idTousers: { connect: { id: adminId } },
            users_chat_messages_admin_idTousers: { connect: { id: adminId } },
            message: dto.message,
            attachment_url: dto.attachmentUrl,
            attachment_type: dto.attachmentType,
        };
        let recipientId = targetId;
        if (type === 'customer') {
            data.users_chat_messages_customer_idTousers = { connect: { id: targetId } };
        }
        else {
            data.laundries = { connect: { id: targetId } };
            const laundry = await this.prisma.laundry.findUnique({ where: { id: targetId }, select: { ownerId: true } });
            if (laundry)
                recipientId = laundry.ownerId;
        }
        const msg = await this.prisma.chat_messages.create({ data });
        this.notificationService
            .sendToUser(recipientId, 'رد من الدعم الفني 🎧', dto.message ?? 'مرفق جديد', { type: 'support_reply', referenceId: msg.id })
            .catch((err) => console.error('Notification error:', err));
        return { success: true, data: msg };
    }
    async markAdminSupportMessagesAsRead(adminId, type, targetId) {
        const where = {
            is_read: false,
            sender_id: { not: adminId },
        };
        if (type === 'customer') {
            where.customer_id = targetId;
            where.laundry_id = null;
        }
        else {
            where.laundry_id = targetId;
            where.customer_id = null;
        }
        await this.prisma.chat_messages.updateMany({
            where,
            data: { is_read: true },
        });
        return { success: true, message: 'تم تحديث حالة القراءة' };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], ChatService);
//# sourceMappingURL=chat.service.js.map