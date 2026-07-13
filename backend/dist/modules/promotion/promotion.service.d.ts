import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { QueryPromotionDto } from './dto/query-promotion.dto';
export declare class PromotionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getLaundryPromotions(laundryId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            description: string;
            title: string;
            startDate: Date;
            endDate: Date;
            imageUrl: string;
        }[];
    }>;
    getPromotionDetails(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            laundryId: string;
            isActive: boolean;
            description: string | null;
            title: string;
            startDate: Date | null;
            endDate: Date | null;
            imageUrl: string | null;
        };
    }>;
    recordView(promotionId: string, userId?: string): Promise<{
        success: boolean;
    }>;
    getMyPromotions(laundryId: string, dto: QueryPromotionDto): Promise<{
        success: boolean;
        data: {
            viewsCount: number;
            isExpired: boolean;
            isUpcoming: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            laundryId: string;
            isActive: boolean;
            description: string | null;
            title: string;
            startDate: Date | null;
            endDate: Date | null;
            imageUrl: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    createPromotion(laundryId: string, dto: CreatePromotionDto): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            laundryId: string;
            isActive: boolean;
            description: string | null;
            title: string;
            startDate: Date | null;
            endDate: Date | null;
            imageUrl: string | null;
        };
    }>;
    updatePromotion(laundryId: string, promotionId: string, dto: UpdatePromotionDto): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            laundryId: string;
            isActive: boolean;
            description: string | null;
            title: string;
            startDate: Date | null;
            endDate: Date | null;
            imageUrl: string | null;
        };
    }>;
    deletePromotion(laundryId: string, promotionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    togglePromotion(laundryId: string, promotionId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            isActive: boolean;
        };
    }>;
}
