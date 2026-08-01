import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { NotificationService } from '../notification/notification.service';
export declare class InvoiceService {
    private readonly prisma;
    private readonly notificationService;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    createInvoice(laundryId: string, dto: CreateInvoiceDto): Promise<{
        success: boolean;
        data: any;
    }>;
    findAll(laundryId: string, query: QueryInvoiceDto): Promise<{
        success: boolean;
        data: {
            totalAmount: number;
            paidAmount: number;
            dueAmount: number;
            id: string;
            createdAt: Date;
            customer: {
                id: string;
                phoneNumber: string;
                uniqueId: string;
                fullName: string;
            };
            status: import(".prisma/client").$Enums.invoice_status;
            invoiceNumber: string;
            paymentType: import(".prisma/client").$Enums.payment_type;
            walk_in_name: string;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(invoiceId: string, laundryId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    updateInvoice(invoiceId: string, laundryId: string, dto: UpdateInvoiceDto): Promise<{
        success: boolean;
        data: any;
    }>;
    updateStatus(invoiceId: string, laundryId: string, changedBy: string, dto: UpdateInvoiceStatusDto): Promise<{
        success: boolean;
        data: any;
    }>;
    getPrintData(invoiceId: string, laundryId: string): Promise<{
        success: boolean;
        data: {
            invoiceNumber: string;
            createdAt: Date;
            completedAt: Date;
            expected_delivery_at: Date;
            status: import(".prisma/client").$Enums.invoice_status;
            paymentType: import(".prisma/client").$Enums.payment_type;
            laundry: {
                phoneNumber: string;
                name: string;
                address: string;
                city: string;
            };
            customer: {
                phoneNumber: string;
                uniqueId: string;
                fullName: string;
            };
            walk_in_name: string;
            walk_in_phone: string;
            items: {
                itemName: string;
                unitPrice: number;
                quantity: number;
                subtotal: number;
                service_type: import(".prisma/client").$Enums.service_type;
                processing_type: import(".prisma/client").$Enums.processing_type;
            }[];
            subtotal: number;
            discount: number;
            tax_amount: number;
            urgency_fee: number;
            totalAmount: number;
            paidAmount: number;
            dueAmount: number;
            notes: string;
        };
    }>;
    findMyInvoices(customerId: string, query: QueryInvoiceDto): Promise<{
        success: boolean;
        data: {
            totalAmount: number;
            paidAmount: number;
            dueAmount: number;
            laundry: {
                id: string;
                name: string;
                city: string;
                logoUrl: string;
            };
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.invoice_status;
            invoiceNumber: string;
            paymentType: import(".prisma/client").$Enums.payment_type;
            expected_delivery_at: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findMyInvoice(invoiceId: string, customerId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    private buildItemLines;
    private formatDetail;
    private throwNotFound;
}
