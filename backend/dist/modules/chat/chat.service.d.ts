import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { SendMessageDto } from './dto/send-message.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
export declare class ChatService {
    private readonly prisma;
    private readonly notificationService;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    getCustomerMessages(customerId: string, laundryId: string, dto: QueryMessagesDto): Promise<{
        success: boolean;
        data: {
            id: string;
            sender_id: string;
            message: string;
            attachment_url: string;
            attachment_type: string;
            is_read: boolean;
            sent_at: Date;
            users_chat_messages_sender_idTousers: {
                fullName: string;
                avatarUrl: string;
                role: import(".prisma/client").$Enums.user_role;
            };
        }[];
    }>;
    sendMessageToLaundry(customerId: string, laundryId: string, dto: SendMessageDto): Promise<{
        success: boolean;
        data: {
            id: string;
            laundry_id: string | null;
            customer_id: string | null;
            admin_id: string | null;
            sender_id: string;
            message: string | null;
            attachment_url: string | null;
            attachment_type: string | null;
            is_read: boolean;
            sent_at: Date;
        };
    }>;
    markAsRead(customerId: string, laundryId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getLaundryMessages(laundryId: string, customerId: string, dto: QueryMessagesDto): Promise<{
        success: boolean;
        data: {
            id: string;
            sender_id: string;
            message: string;
            attachment_url: string;
            attachment_type: string;
            is_read: boolean;
            sent_at: Date;
            users_chat_messages_sender_idTousers: {
                fullName: string;
                avatarUrl: string;
                role: import(".prisma/client").$Enums.user_role;
            };
        }[];
    }>;
    sendMessageToCustomer(laundryId: string, customerId: string, dto: SendMessageDto): Promise<{
        success: boolean;
        data: {
            id: string;
            laundry_id: string | null;
            customer_id: string | null;
            admin_id: string | null;
            sender_id: string;
            message: string | null;
            attachment_url: string | null;
            attachment_type: string | null;
            is_read: boolean;
            sent_at: Date;
        };
    }>;
    markAsReadByLaundry(laundryId: string, customerId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    sendMessageToSupport(senderId: string, senderRole: string, dto: SendMessageDto): Promise<{
        success: boolean;
        data: {
            id: string;
            laundry_id: string | null;
            customer_id: string | null;
            admin_id: string | null;
            sender_id: string;
            message: string | null;
            attachment_url: string | null;
            attachment_type: string | null;
            is_read: boolean;
            sent_at: Date;
        };
    }>;
    getLaundryConversations(laundryId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            customer: {
                id: string;
                fullName: string;
                avatarUrl: string;
            };
            lastMessage: {
                id: string;
                message: string;
                attachmentUrl: string;
                attachmentType: string;
                isRead: boolean;
                sentAt: Date;
                senderId: string;
            };
            unreadCount: number;
        }[];
    }>;
    getSupportMessages(senderId: string, senderRole: string, dto: QueryMessagesDto): Promise<{
        success: boolean;
        data: {
            id: string;
            sender_id: string;
            message: string;
            attachment_url: string;
            attachment_type: string;
            is_read: boolean;
            sent_at: Date;
            users_chat_messages_sender_idTousers: {
                fullName: string;
                avatarUrl: string;
                role: import(".prisma/client").$Enums.user_role;
            };
        }[];
    }>;
    deleteMessage(messageId: string, requesterId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAdminSupportConversations(): Promise<{
        success: boolean;
        data: any[];
    }>;
    getAdminSupportMessages(type: 'customer' | 'laundry', targetId: string, dto: QueryMessagesDto): Promise<{
        success: boolean;
        data: {
            id: string;
            sender_id: string;
            message: string;
            attachment_url: string;
            attachment_type: string;
            is_read: boolean;
            sent_at: Date;
            users_chat_messages_sender_idTousers: {
                fullName: string;
                avatarUrl: string;
                role: import(".prisma/client").$Enums.user_role;
            };
        }[];
    }>;
    sendMessageFromAdmin(adminId: string, type: 'customer' | 'laundry', targetId: string, dto: SendMessageDto): Promise<{
        success: boolean;
        data: {
            id: string;
            laundry_id: string | null;
            customer_id: string | null;
            admin_id: string | null;
            sender_id: string;
            message: string | null;
            attachment_url: string | null;
            attachment_type: string | null;
            is_read: boolean;
            sent_at: Date;
        };
    }>;
    markAdminSupportMessagesAsRead(adminId: string, type: 'customer' | 'laundry', targetId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
