import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { QueryRatingDto } from './dto/query-rating.dto';
export declare class RatingController {
    private readonly ratingService;
    constructor(ratingService: RatingService);
    createRating(req: any, dto: CreateRatingDto): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            laundryId: string;
            customerId: string;
            invoiceId: string;
            stars: number;
            comment: string | null;
        };
    }>;
    getMyRatings(req: any): Promise<{
        success: boolean;
        data: {
            laundry: {
                id: string;
                name: string;
                logoUrl: string;
            };
            id: string;
            createdAt: Date;
            invoice: {
                invoiceNumber: string;
            };
            stars: number;
            comment: string;
        }[];
    }>;
    canRate(req: any, invoiceId: string): Promise<{
        success: boolean;
        data: {
            canRate: boolean;
            reason: string;
            existingRating?: undefined;
        };
    } | {
        success: boolean;
        data: {
            canRate: boolean;
            reason: string;
            existingRating: {
                id: string;
                createdAt: Date;
                laundryId: string;
                customerId: string;
                invoiceId: string;
                stars: number;
                comment: string | null;
            };
        };
    } | {
        success: boolean;
        data: {
            canRate: boolean;
            reason?: undefined;
            existingRating?: undefined;
        };
    }>;
    getLaundryRatings(laundryId: string, query: QueryRatingDto): Promise<{
        success: boolean;
        data: {
            summary: {
                ratingAvg: number;
                ratingCount: number;
                distribution: Record<number, number>;
            };
            reviews: {
                id: string;
                createdAt: Date;
                customer: {
                    fullName: string;
                    avatarUrl: string;
                };
                stars: number;
                comment: string;
            }[];
        };
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
