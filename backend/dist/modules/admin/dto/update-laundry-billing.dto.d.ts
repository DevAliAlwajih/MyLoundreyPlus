export declare class UpdateLaundryBillingDto {
    billing_type?: 'subscription' | 'commission';
    commission_rate?: number;
    debt_limit?: number;
    balance?: number;
    trial_commission_ends_at?: string;
}
