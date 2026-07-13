export declare class UpdateLaundryDto {
    name?: string;
    nameAr?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    workingHours?: Record<string, {
        open: string;
        close: string;
        closed?: boolean;
    }>;
    logoUrl?: string | null;
    tax_enabled?: boolean;
    tax_rate?: number;
    urgency_enabled?: boolean;
    urgency_fee?: number;
}
