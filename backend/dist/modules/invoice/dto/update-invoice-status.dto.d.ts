export declare const INVOICE_STATUSES: readonly ["draft", "received", "washing", "ironing", "ready", "completed", "cancelled"];
export type InvoiceStatusType = (typeof INVOICE_STATUSES)[number];
export declare class UpdateInvoiceStatusDto {
    status: InvoiceStatusType;
    note?: string;
}
