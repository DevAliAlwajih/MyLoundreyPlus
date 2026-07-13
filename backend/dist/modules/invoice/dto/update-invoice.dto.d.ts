import { InvoiceItemLineDto } from './create-invoice.dto';
export declare class UpdateInvoiceDto {
    items?: InvoiceItemLineDto[];
    paymentType?: 'cash' | 'card' | 'deferred';
    paidAmount?: number;
    discount?: number;
    notes?: string;
}
