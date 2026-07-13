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
            createdAt: Date;
            updatedAt: Date;
            laundryId: string;
            isActive: boolean;
            title: string;
            description: string | null;
            imageUrl: string | null;
            startDate: Date | null;
            endDate: Date | null;
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
            createdAt: Date;
            updatedAt: Date;
            laundryId: string;
            isActive: boolean;
            title: string;
            description: string | null;
            imageUrl: string | null;
            startDate: Date | null;
            endDate: Date | null;
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
            createdAt: Date;
            updatedAt: Date;
            laundryId: string;
            isActive: boolean;
            title: string;
            description: string | null;
            imageUrl: string | null;
            startDate: Date | null;
            endDate: Date | null;
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
            createdAt: Date;
            title: string;
            description: string;
            imageUrl: string;
            startDate: Date;
            endDate: Date;
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
            title: string;
            description: string | null;
            imageUrl: string | null;
            startDate: Date | null;
            endDate: Date | null;
        };
    }>;
    recordView(req: any, id: string): Promise<{
        success: boolean;
    }>;
}
