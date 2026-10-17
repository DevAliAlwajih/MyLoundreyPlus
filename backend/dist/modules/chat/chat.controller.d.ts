import { ChatService } from './chat.service';
import { UploadService } from '../../upload/upload.service';
import { SendMessageDto } from './dto/send-message.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
export declare class ChatController {
    private readonly chatService;
    private readonly uploadService;
    constructor(chatService: ChatService, uploadService: UploadService);
    uploadAttachment(file: Express.Multer.File): Promise<{
        success: boolean;
        data: {
            url: string;
            type: string;
        };
    }>;
    getSupportMessages(req: any, query: QueryMessagesDto): Promise<{
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
    sendMessageToSupport(req: any, dto: SendMessageDto): Promise<{
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
    private getLaundryId;
    getLaundryConversations(req: any): Promise<{
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
    getLaundryMessages(req: any, customerId: string, query: QueryMessagesDto): Promise<{
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
    sendMessageToCustomer(req: any, customerId: string, dto: SendMessageDto): Promise<{
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
    markAsReadByLaundry(req: any, customerId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getCustomerMessages(req: any, laundryId: string, query: QueryMessagesDto): Promise<{
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
    sendMessageToLaundry(req: any, laundryId: string, dto: SendMessageDto): Promise<{
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
    markAsRead(req: any, laundryId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteMessage(req: any, messageId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAdminSupportConversations(): Promise<{
        success: boolean;
        data: any[];
    }>;
    getAdminSupportMessages(type: 'customer' | 'laundry', targetId: string, query: QueryMessagesDto): Promise<{
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
    sendMessageFromAdmin(req: any, type: 'customer' | 'laundry', targetId: string, dto: SendMessageDto): Promise<{
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
    markAdminSupportMessagesAsRead(req: any, type: 'customer' | 'laundry', targetId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
