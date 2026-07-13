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
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
let SupportService = class SupportService {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
    }
    async createTicket(userId, userRole, dto) {
        const userType = userRole === 'laundry' ? 'laundry' : 'customer';
        const ticket = await this.prisma.supportTicket.create({
            data: {
                user: { connect: { id: userId } },
                userType,
                subject: dto.subject,
                message: dto.message,
                status: 'open',
            },
        });
        const admin = await this.prisma.user.findFirst({
            where: { role: 'admin' },
            select: { id: true },
        });
        if (admin) {
            await this.notificationService.sendToUser(admin.id, 'تذكرة دعم جديدة 🎫', `${dto.subject}`, { type: 'new_ticket', referenceId: ticket.id });
        }
        return { success: true, data: ticket };
    }
    async getMyTickets(userId, dto) {
        const where = {
            userId,
            ...(dto.status ? { status: dto.status } : {}),
        };
        const [tickets, total] = await this.prisma.$transaction([
            this.prisma.supportTicket.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: ((dto.page ?? 1) - 1) * (dto.limit ?? 20),
                take: dto.limit ?? 20,
                select: {
                    id: true,
                    subject: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    adminReply: true,
                },
            }),
            this.prisma.supportTicket.count({ where }),
        ]);
        return {
            success: true,
            data: tickets,
            meta: { total, page: dto.page ?? 1, limit: dto.limit ?? 20 },
        };
    }
    async getMyTicketDetails(userId, ticketId) {
        const ticket = await this.prisma.supportTicket.findFirst({
            where: { id: ticketId, userId },
        });
        if (!ticket) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'TICKET_NOT_FOUND', message: 'التذكرة غير موجودة' },
            });
        }
        return { success: true, data: ticket };
    }
    async replyToTicket(adminId, ticketId, reply) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            select: { id: true, userId: true, status: true, subject: true },
        });
        if (!ticket) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'TICKET_NOT_FOUND', message: 'التذكرة غير موجودة' },
            });
        }
        if (ticket.status === 'closed') {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'TICKET_CLOSED', message: 'لا يمكن الرد على تذكرة مغلقة' },
            });
        }
        const updated = await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                adminReply: reply,
                status: 'in_progress',
            },
        });
        await this.notificationService.sendToUser(ticket.userId, 'رد جديد على تذكرتك 💬', `تذكرة: ${ticket.subject}`, { type: 'ticket_reply', referenceId: ticketId });
        return { success: true, data: updated };
    }
    async updateTicketStatus(adminId, ticketId, dto) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            select: { id: true, userId: true, status: true },
        });
        if (!ticket) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'TICKET_NOT_FOUND', message: 'التذكرة غير موجودة' },
            });
        }
        const data = { status: dto.status };
        if (dto.status === 'resolved' || dto.status === 'closed') {
            data.resolvedBy = adminId;
            data.resolvedAt = new Date();
        }
        const updated = await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data,
        });
        if (dto.status === 'resolved') {
            await this.notificationService.sendToUser(ticket.userId, 'تم حل تذكرتك ✅', 'تم التعامل مع مشكلتك بنجاح', { type: 'ticket_resolved', referenceId: ticketId });
        }
        return { success: true, data: updated };
    }
    async getAllTickets(dto) {
        const where = {
            ...(dto.status ? { status: dto.status } : {}),
            ...(dto.userType ? { userType: dto.userType } : {}),
        };
        const [tickets, total] = await this.prisma.$transaction([
            this.prisma.supportTicket.findMany({
                where,
                orderBy: [
                    { status: 'asc' },
                    { createdAt: 'desc' },
                ],
                skip: ((dto.page ?? 1) - 1) * (dto.limit ?? 20),
                take: dto.limit ?? 20,
                include: {
                    user: { select: { fullName: true, email: true, role: true } },
                },
            }),
            this.prisma.supportTicket.count({ where }),
        ]);
        return {
            success: true,
            data: tickets,
            meta: { total, page: dto.page ?? 1, limit: dto.limit ?? 20 },
        };
    }
    async getTicketDetails(ticketId) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                user: { select: { fullName: true, email: true, role: true } },
            },
        });
        if (!ticket) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'TICKET_NOT_FOUND', message: 'التذكرة غير موجودة' },
            });
        }
        return { success: true, data: ticket };
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], SupportService);
//# sourceMappingURL=support.service.js.map