import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketDto } from './dto/query-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket.dto';
import { ticket_status, ticket_user_type } from '@prisma/client';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async createTicket(userId: string, userRole: string, dto: CreateTicketDto) {
    const userType: ticket_user_type = userRole === 'laundry' ? 'laundry' : 'customer';

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
      await this.notificationService.sendToUser(
        admin.id,
        'تذكرة دعم جديدة 🎫',
        `${dto.subject}`,
        { type: 'new_ticket', referenceId: ticket.id },
      );
    }

    return { success: true, data: ticket };
  }

  async getMyTickets(userId: string, dto: QueryTicketDto) {
    const where: any = {
      userId,
      ...(dto.status ? { status: dto.status as ticket_status } : {}),
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

  async getMyTicketDetails(userId: string, ticketId: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, userId },
    });
    if (!ticket) {
      throw new NotFoundException({
        success: false,
        error: { code: 'TICKET_NOT_FOUND', message: 'التذكرة غير موجودة' },
      });
    }
    return { success: true, data: ticket };
  }

  async replyToTicket(adminId: string, ticketId: string, reply: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true, status: true, subject: true },
    });
    if (!ticket) {
      throw new NotFoundException({
        success: false,
        error: { code: 'TICKET_NOT_FOUND', message: 'التذكرة غير موجودة' },
      });
    }

    if (ticket.status === 'closed') {
      throw new BadRequestException({
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

    await this.notificationService.sendToUser(
      ticket.userId,
      'رد جديد على تذكرتك 💬',
      `تذكرة: ${ticket.subject}`,
      { type: 'ticket_reply', referenceId: ticketId },
    );

    return { success: true, data: updated };
  }

  async updateTicketStatus(adminId: string, ticketId: string, dto: UpdateTicketStatusDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true, status: true },
    });
    if (!ticket) {
      throw new NotFoundException({
        success: false,
        error: { code: 'TICKET_NOT_FOUND', message: 'التذكرة غير موجودة' },
      });
    }

    const data: any = { status: dto.status as ticket_status };

    if (dto.status === 'resolved' || dto.status === 'closed') {
      data.resolvedBy = adminId;
      data.resolvedAt = new Date();
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data,
    });

    if (dto.status === 'resolved') {
      await this.notificationService.sendToUser(
        ticket.userId,
        'تم حل تذكرتك ✅',
        'تم التعامل مع مشكلتك بنجاح',
        { type: 'ticket_resolved', referenceId: ticketId },
      );
    }

    return { success: true, data: updated };
  }

  async getAllTickets(dto: QueryTicketDto) {
    const where: any = {
      ...(dto.status ? { status: dto.status as ticket_status } : {}),
      ...(dto.userType ? { userType: dto.userType as ticket_user_type } : {}),
    };

    const [tickets, total] = await this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: [
          { status: 'asc' }, // open first
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

  async getTicketDetails(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { fullName: true, email: true, role: true } },
      },
    });
    if (!ticket) {
      throw new NotFoundException({
        success: false,
        error: { code: 'TICKET_NOT_FOUND', message: 'التذكرة غير موجودة' },
      });
    }
    return { success: true, data: ticket };
  }
}
