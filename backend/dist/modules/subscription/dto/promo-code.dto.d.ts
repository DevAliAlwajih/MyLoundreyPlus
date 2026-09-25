export declare class CreatePromoCodeDto {
    code: string;
    description?: string;
    discountType: string;
    discountValue: number;
    maxUses?: number;
    validFrom?: string;
    validUntil?: string;
    isActive?: boolean;
}
export declare class UpdatePromoCodeDto {
    code?: string;
    description?: string;
    discountType?: string;
    discountValue?: number;
    maxUses?: number;
    validFrom?: string;
    validUntil?: string;
    isActive?: boolean;
}
