export declare class CreatePlanDto {
    nameAr: string;
    nameEn: string;
    durationDays: number;
    priceSar: number;
    features?: any;
    isActive?: boolean;
    isSeasonal?: boolean;
    occasionName?: string;
    discountPercent?: number;
    offerValidFrom?: string;
    offerValidUntil?: string;
}
export declare class UpdatePlanDto {
    nameAr?: string;
    nameEn?: string;
    durationDays?: number;
    priceSar?: number;
    features?: any;
    isActive?: boolean;
    isSeasonal?: boolean;
    occasionName?: string;
    discountPercent?: number;
    offerValidFrom?: string;
    offerValidUntil?: string;
}
