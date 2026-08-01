import { PrismaService } from '../../prisma/prisma.service';
import { FirebaseService } from '../../firebase/firebase.service';
export declare class NotificationService {
    private readonly prisma;
    private readonly firebase;
    private readonly logger;
    constructor(prisma: PrismaService, firebase: FirebaseService);
    sendToUser(userId: string, title: string, body: string, options?: {
        type?: string;
        referenceId?: string;
        data?: Record<string, string>;
    }): Promise<{
        id: string;
        userId: string;
        title: string;
        body: string;
        type: string | null;
        referenceId: string | null;
        isRead: boolean;
        sentAt: Date;
    }>;
    sendInvoiceStatusNotification(customerId: string | null, invoiceNumber: string, newStatus: string, invoiceId: string): Promise<{
        id: string;
        userId: string;
        title: string;
        body: string;
        type: string | null;
        referenceId: string | null;
        isRead: boolean;
        sentAt: Date;
    }>;
    sendToLaundryOwner(laundryId: string, title: string, body: string, options?: {
        type?: string;
        referenceId?: string;
    }): Promise<{
        id: string;
        userId: string;
        title: string;
        body: string;
        type: string | null;
        referenceId: string | null;
        isRead: boolean;
        sentAt: Date;
    }>;
    getNotifications(userId: string, page?: number, limit?: number, unreadOnly?: boolean): Promise<{
        success: boolean;
        data: {
            id: string;
            title: string;
            body: string;
            type: string;
            referenceId: string;
            isRead: boolean;
            sentAt: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            unreadCount: number;
        };
    }>;
    markAsRead(userId: string, notificationId: string): Promise<{
        success: boolean;
        error: {
            code: string;
            message: string;
        };
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        error?: undefined;
    }>;
    markAllAsRead(userId: string): Promise<{
        success: boolean;
        message: string;
        count: number;
    }>;
    getUnreadCount(userId: string): Promise<{
        success: boolean;
        data: {
            count: number;
        };
    }>;
}
