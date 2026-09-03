import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
export declare class InvoiceLaundryController {
    private readonly invoiceService;
    constructor(invoiceService: InvoiceService);
    create(req: any, dto: CreateInvoiceDto): Promise<{
        success: boolean;
        data: any;
    }>;
    findAll(req: any, query: QueryInvoiceDto): Promise<{
        success: boolean;
        data: {
            customerName: any;
            customerPhone: any;
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
            customerId: string;
            paymentType: import(".prisma/client").$Enums.payment_type;
            walk_in_name: string;
            walk_in_phone: string;
            is_edited: boolean;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(req: any, id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    update(req: any, id: string, dto: UpdateInvoiceDto): Promise<{
        success: boolean;
        data: any;
    }>;
    updateStatus(req: any, id: string, dto: UpdateInvoiceStatusDto): Promise<{
        success: boolean;
        data: any;
    }>;
    getPrintData(req: any, id: string): Promise<{
        success: boolean;
        data: {
            invoiceNumber: string;
            createdAt: Date;
            completedAt: Date;
            expected_delivery_at: Date;
            status: import(".prisma/client").$Enums.invoice_status;
            paymentType: import(".prisma/client").$Enums.payment_type;
            laundry: {
                name: string;
                phoneNumber: string;
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
}
export declare class InvoiceCustomerController {
    private readonly invoiceService;
    constructor(invoiceService: InvoiceService);
    findMyInvoices(req: any, query: QueryInvoiceDto): Promise<{
        success: boolean;
        data: {
            totalAmount: number;
            paidAmount: number;
            dueAmount: number;
            id: string;
            createdAt: Date;
            laundry: {
                id: string;
                name: string;
                city: string;
                logoUrl: string;
            };
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
    findMyInvoice(req: any, id: string): Promise<{
        success: boolean;
        data: any;
    }>;
}
