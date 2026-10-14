export declare class QueryLaundryDto {
    lat?: number;
    lng?: number;
    radius?: number;
    sort?: 'distance' | 'rating' | 'price';
    city?: string;
    country?: string;
    currency?: string;
    page?: number;
    limit?: number;
}
