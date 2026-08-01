import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketDto } from './dto/query-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket.dto';
export declare class SupportService {
    private readonly prisma;
    private readonly notificationService;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    createTicket(userId: string, userRole: string, dto: CreateTicketDto): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            subject: string;
            status: import(".prisma/client").$Enums.ticket_status;
            message: string;
            userType: import(".prisma/client").$Enums.ticket_user_type;
            adminReply: string | null;
            resolvedAt: Date | null;
            resolvedBy: string | null;
        };
    }>;
    getMyTickets(userId: string, dto: QueryTicketDto): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            subject: string;
            status: import(".prisma/client").$Enums.ticket_status;
            adminReply: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    getMyTicketDetails(userId: string, ticketId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            subject: string;
            status: import(".prisma/client").$Enums.ticket_status;
            message: string;
            userType: import(".prisma/client").$Enums.ticket_user_type;
            adminReply: string | null;
            resolvedAt: Date | null;
            resolvedBy: string | null;
        };
    }>;
    replyToTicket(adminId: string, ticketId: string, reply: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            subject: string;
            status: import(".prisma/client").$Enums.ticket_status;
            message: string;
            userType: import(".prisma/client").$Enums.ticket_user_type;
            adminReply: string | null;
            resolvedAt: Date | null;
            resolvedBy: string | null;
        };
    }>;
    updateTicketStatus(adminId: string, ticketId: string, dto: UpdateTicketStatusDto): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            subject: string;
            status: import(".prisma/client").$Enums.ticket_status;
            message: string;
            userType: import(".prisma/client").$Enums.ticket_user_type;
            adminReply: string | null;
            resolvedAt: Date | null;
            resolvedBy: string | null;
        };
    }>;
    getAllTickets(dto: QueryTicketDto): Promise<{
        success: boolean;
        data: ({
            user: {
                email: string;
                fullName: string;
                role: import(".prisma/client").$Enums.user_role;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            subject: string;
            status: import(".prisma/client").$Enums.ticket_status;
            message: string;
            userType: import(".prisma/client").$Enums.ticket_user_type;
            adminReply: string | null;
            resolvedAt: Date | null;
            resolvedBy: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    getTicketDetails(ticketId: string): Promise<{
        success: boolean;
        data: {
            user: {
                email: string;
                fullName: string;
                role: import(".prisma/client").$Enums.user_role;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            subject: string;
            status: import(".prisma/client").$Enums.ticket_status;
            message: string;
            userType: import(".prisma/client").$Enums.ticket_user_type;
            adminReply: string | null;
            resolvedAt: Date | null;
            resolvedBy: string | null;
        };
    }>;
}
