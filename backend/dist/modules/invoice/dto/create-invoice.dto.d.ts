export declare class InvoiceItemLineDto {
    itemId: string;
    quantity: number;
    unitPrice?: number;
    serviceType?: 'washing_only' | 'ironing_only' | 'washing_and_ironing';
    processingType?: 'normal' | 'urgent';
    notes?: string;
}
export declare class CreateInvoiceDto {
    customerUniqueId?: string;
    customerId?: string;
    walkInName?: string;
    walkInPhone?: string;
    walkInLocation?: string;
    paymentType: 'cash' | 'card' | 'deferred' | 'electronic';
    items: InvoiceItemLineDto[];
    discount?: number;
    discountPercent?: number;
    isUrgent?: boolean;
    notes?: string;
    expectedDeliveryAt?: Date;
    status?: 'draft' | 'received';
}
