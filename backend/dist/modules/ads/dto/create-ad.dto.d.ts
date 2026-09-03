export declare enum AdTarget {
    all = "all",
    customers = "customers",
    laundries = "laundries"
}
export declare class CreateAdDto {
    title: string;
    mediaUrls: string[];
    bodyText?: string;
    linkUrl?: string;
    targetAudience?: AdTarget;
    adFee?: number;
    sortOrder?: number;
    startDate?: string;
    endDate?: string;
}
