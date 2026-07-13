export declare class QueryLaundryDto {
    lat?: number;
    lng?: number;
    radius?: number;
    sort?: 'distance' | 'rating' | 'price';
    city?: string;
    country?: string;
    page?: number;
    limit?: number;
}
