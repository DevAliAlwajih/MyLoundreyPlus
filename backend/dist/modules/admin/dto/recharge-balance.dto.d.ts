export declare class RechargeBalanceDto {
    amount: number;
    payment_method?: 'cash' | 'bank_transfer' | 'cheque' | 'electronic' | 'other';
    reference_number?: string;
    notes?: string;
}
