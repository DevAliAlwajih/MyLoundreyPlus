import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { QueryRatingDto } from './dto/query-rating.dto';
export declare class RatingService {
    private readonly prisma;
    private readonly notificationService;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    createRating(customerId: string, dto: CreateRatingDto): Promise<{
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
    canRate(customerId: string, invoiceId: string): Promise<{
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
    getLaundryRatings(laundryId: string, dto: QueryRatingDto): Promise<{
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
    getMyRatings(customerId: string): Promise<{
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
}
