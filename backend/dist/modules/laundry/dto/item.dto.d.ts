export declare class CreateItemDto {
    categoryId: string;
    nameAr: string;
    nameEn?: string;
    basePrice: number;
    washing_price?: number;
    ironing_price?: number;
    sortOrder?: number;
}
export declare class UpdateItemDto {
    nameAr?: string;
    nameEn?: string;
    basePrice?: number;
    washing_price?: number;
    ironing_price?: number;
    sortOrder?: number;
    isActive?: boolean;
}
export declare class UpdatePriceDto {
    price?: number;
    isAvailable?: boolean;
}
