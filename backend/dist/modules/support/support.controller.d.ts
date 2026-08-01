import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketDto } from './dto/query-ticket.dto';
import { UpdateTicketStatusDto, ReplyTicketDto } from './dto/update-ticket.dto';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    createTicket(req: any, dto: CreateTicketDto): Promise<{
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
    getMyTickets(req: any, dto: QueryTicketDto): Promise<{
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
    getMyTicketDetails(req: any, id: string): Promise<{
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
    getTicketDetails(id: string): Promise<{
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
    replyToTicket(req: any, id: string, dto: ReplyTicketDto): Promise<{
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
    updateTicketStatus(req: any, id: string, dto: UpdateTicketStatusDto): Promise<{
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
}
