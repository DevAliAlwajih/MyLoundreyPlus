import { NotificationService } from './notification.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    getNotifications(req: any, query: QueryNotificationsDto): Promise<{
        success: boolean;
        data: {
            id: string;
            type: string;
            title: string;
            body: string;
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
    getUnreadCount(req: any): Promise<{
        success: boolean;
        data: {
            count: number;
        };
    }>;
    markAllAsRead(req: any): Promise<{
        success: boolean;
        message: string;
        count: number;
    }>;
    markAsRead(req: any, id: string): Promise<{
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
}
