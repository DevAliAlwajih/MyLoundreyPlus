import { PromotionService } from './promotion.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { QueryPromotionDto } from './dto/query-promotion.dto';
import { UploadService } from '../../upload/upload.service';
export declare class PromotionController {
    private readonly promotionService;
    private readonly uploadService;
    constructor(promotionService: PromotionService, uploadService: UploadService);
    private getLaundryId;
    uploadImage(file: Express.Multer.File): Promise<{
        success: boolean;
        data: {
            url: string;
        };
    }>;
    getMyPromotions(req: any, query: QueryPromotionDto): Promise<{
        success: boolean;
        data: {
            viewsCount: number;
            isExpired: boolean;
            isUpcoming: boolean;
            id: string;
            title: string;
            startDate: Date | null;
            endDate: Date | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            laundryId: string;
            imageUrl: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    createPromotion(req: any, dto: CreatePromotionDto): Promise<{
        success: boolean;
        data: {
            id: string;
            title: string;
            startDate: Date | null;
            endDate: Date | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            laundryId: string;
            imageUrl: string | null;
        };
    }>;
    togglePromotion(req: any, id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            isActive: boolean;
        };
    }>;
    updatePromotion(req: any, id: string, dto: UpdatePromotionDto): Promise<{
        success: boolean;
        data: {
            id: string;
            title: string;
            startDate: Date | null;
            endDate: Date | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            laundryId: string;
            imageUrl: string | null;
        };
    }>;
    deletePromotion(req: any, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getLaundryPromotions(laundryId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            title: string;
            startDate: Date;
            endDate: Date;
            createdAt: Date;
            description: string;
            imageUrl: string;
        }[];
    }>;
    getPromotionDetails(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            title: string;
            startDate: Date | null;
            endDate: Date | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            laundryId: string;
            imageUrl: string | null;
        };
    }>;
    recordView(req: any, id: string): Promise<{
        success: boolean;
    }>;
}
