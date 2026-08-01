import { InvoiceStatusType } from './update-invoice-status.dto';
export declare class QueryInvoiceDto {
    status?: InvoiceStatusType;
    customerId?: string;
    search?: string;
    page?: number;
    limit?: number;
}
