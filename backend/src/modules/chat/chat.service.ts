import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { SendMessageDto } from './dto/send-message.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';

// ─── Preset for selecting messages ────────────────────────
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
} as const;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // ────────────────────────────────────────────────────
  // 1. العميل ↔ المغسلة
  // ────────────────────────────────────────────────────

  async getCustomerMessages(customerId: string, laundryId: string, dto: QueryMessagesDto) {
    const laundry = await this.prisma.laundry.findUnique({
      where: { id: laundryId },
      select: { id: true },
    });
    if (!laundry) {
      throw new NotFoundException({
        success: false,
        error: { code: 'LAUNDRY_NOT_FOUND', message: 'المغسلة غير موجودة' },
      });
    }

    const { page = 1, limit = 50, before } = dto;
    const where: any = {
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
      data: messages.reverse(), // الأقدم أولاً للعرض في المحادثة
    };
  }

  async sendMessageToLaundry(customerId: string, laundryId: string, dto: SendMessageDto) {
    if (!dto.message && !dto.attachmentUrl) {
      throw new BadRequestException({
        success: false,
        error: { code: 'EMPTY_MESSAGE', message: 'يجب إرسال نص أو مرفق' },
      });
    }

    const laundry = await this.prisma.laundry.findFirst({
      where: { id: laundryId, status: { in: ['active', 'trial'] as any[] } },
      select: { id: true, ownerId: true },
    });

    if (!laundry) {
      throw new NotFoundException({
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

    // إشعار FCM لصاحب المغسلة
    this.notificationService
      .sendToUser(
        laundry.ownerId,
        'رسالة جديدة 💬',
        dto.message ?? 'أرسل لك مرفقاً',
        { type: 'new_message', referenceId: msg.id },
      )
      .catch((err) => console.error('Notification error:', err));

    return { success: true, data: msg };
  }

  async markAsRead(customerId: string, laundryId: string) {
    await this.prisma.chat_messages.updateMany({
      where: {
        laundry_id: laundryId,
        customer_id: customerId,
        admin_id: null,
        sender_id: { not: customerId }, // رسائل الطرف الآخر فقط
        is_read: false,
      },
      data: { is_read: true },
    });

    return { success: true, message: 'تم تحديث حالة القراءة' };
  }

  // ────────────────────────────────────────────────────
  // 2. المغسلة ↔ العميل
  // ────────────────────────────────────────────────────

  async getLaundryMessages(laundryId: string, customerId: string, dto: QueryMessagesDto) {
    const { page = 1, limit = 50, before } = dto;
    const where: any = {
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

  async sendMessageToCustomer(laundryId: string, customerId: string, dto: SendMessageDto) {
    if (!dto.message && !dto.attachmentUrl) {
      throw new BadRequestException({
        success: false,
        error: { code: 'EMPTY_MESSAGE', message: 'يجب إرسال نص أو مرفق' },
      });
    }

    const customer = await this.prisma.user.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException({
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
        users_chat_messages_sender_idTousers: { connect: { id: laundry!.ownerId } },
        message: dto.message,
        attachment_url: dto.attachmentUrl,
        attachment_type: dto.attachmentType,
      },
    });

    // إشعار للعميل
    this.notificationService
      .sendToUser(
        customerId,
        'رسالة من المغسلة 💬',
        dto.message ?? 'أرسلت لك مرفقاً',
        { type: 'new_message', referenceId: msg.id },
      )
      .catch((err) => console.error('Notification error:', err));

    return { success: true, data: msg };
  }

  async markAsReadByLaundry(laundryId: string, customerId: string) {
    const laundry = await this.prisma.laundry.findUnique({
      where: { id: laundryId },
      select: { ownerId: true },
    });

    await this.prisma.chat_messages.updateMany({
      where: {
        laundry_id: laundryId,
        customer_id: customerId,
        admin_id: null,
        sender_id: { not: laundry!.ownerId }, // رسائل العميل
        is_read: false,
      },
      data: { is_read: true },
    });

    return { success: true, message: 'تم تحديث حالة القراءة' };
  }

  // ────────────────────────────────────────────────────
  // 3. محادثة الدعم الفني (إدارة النظام)
  // ────────────────────────────────────────────────────

  async sendMessageToSupport(senderId: string, senderRole: string, dto: SendMessageDto) {
    if (!dto.message && !dto.attachmentUrl) {
      throw new BadRequestException({
        success: false,
        error: { code: 'EMPTY_MESSAGE', message: 'يجب إرسال نص أو مرفق' },
      });
    }

    const admin = await this.prisma.user.findFirst({
      where: { role: 'admin' as any },
      select: { id: true },
    });

    if (!admin) {
      throw new ServiceUnavailableException({
        success: false,
        error: { code: 'SUPPORT_UNAVAILABLE', message: 'الدعم الفني غير متاح حالياً' },
      });
    }

    const data: any = {
      users_chat_messages_sender_idTousers: { connect: { id: senderId } },
      users_chat_messages_admin_idTousers: { connect: { id: admin.id } },
      message: dto.message,
      attachment_url: dto.attachmentUrl,
      attachment_type: dto.attachmentType,
    };

    if (senderRole === 'customer') {
      data.users_chat_messages_customer_idTousers = { connect: { id: senderId } };
    } else if (senderRole === 'laundry') {
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
      .sendToUser(
        admin.id,
        'رسالة دعم فني جديدة 🔔',
        dto.message ?? 'مرفق جديد',
        { type: 'support_message', referenceId: msg.id },
      )
      .catch((err) => console.error('Notification error:', err));

    return { success: true, data: msg };
  }

  async getSupportMessages(senderId: string, senderRole: string, dto: QueryMessagesDto) {
    const { page = 1, limit = 50, before } = dto;
    const where: any = {
      admin_id: { not: null },
    };

    if (senderRole === 'customer') {
      where.customer_id = senderId;
    } else if (senderRole === 'laundry') {
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
}
