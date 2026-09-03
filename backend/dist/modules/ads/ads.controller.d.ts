import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { QueryAdDto } from './dto/query-ad.dto';
import { UploadService } from '../../upload/upload.service';
export declare class AdsController {
    private readonly adsService;
    private readonly uploadService;
    constructor(adsService: AdsService, uploadService: UploadService);
    getAllAdsForAdmin(query: QueryAdDto): Promise<{
        success: boolean;
        data: {
            viewsCount: number;
            id: string;
            title: string;
            mediaUrls: import("@prisma/client/runtime/library").JsonValue;
            bodyText: string | null;
            linkUrl: string | null;
            targetAudience: import(".prisma/client").$Enums.ad_target;
            adFee: import("@prisma/client/runtime/library").Decimal | null;
            sortOrder: number | null;
            startDate: Date | null;
            endDate: Date | null;
            isActive: boolean;
            createdBy: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    uploadImage(file: Express.Multer.File): Promise<{
        success: boolean;
        data: {
            url: string;
        };
    }>;
    createAd(req: any, dto: CreateAdDto): Promise<{
        success: boolean;
        data: {
            id: string;
            title: string;
            mediaUrls: import("@prisma/client/runtime/library").JsonValue;
            bodyText: string | null;
            linkUrl: string | null;
            targetAudience: import(".prisma/client").$Enums.ad_target;
            adFee: import("@prisma/client/runtime/library").Decimal | null;
            sortOrder: number | null;
            startDate: Date | null;
            endDate: Date | null;
            isActive: boolean;
            createdBy: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    toggleAd(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            isActive: boolean;
        };
    }>;
    updateAd(id: string, dto: UpdateAdDto): Promise<{
        success: boolean;
        data: {
            id: string;
            title: string;
            mediaUrls: import("@prisma/client/runtime/library").JsonValue;
            bodyText: string | null;
            linkUrl: string | null;
            targetAudience: import(".prisma/client").$Enums.ad_target;
            adFee: import("@prisma/client/runtime/library").Decimal | null;
            sortOrder: number | null;
            startDate: Date | null;
            endDate: Date | null;
            isActive: boolean;
            createdBy: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    deleteAd(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getActiveAds(req: any, query: QueryAdDto): Promise<{
        success: boolean;
        data: {
            id: string;
            title: string;
            mediaUrls: import("@prisma/client/runtime/library").JsonValue;
            bodyText: string;
            linkUrl: string;
            targetAudience: import(".prisma/client").$Enums.ad_target;
            adFee: import("@prisma/client/runtime/library").Decimal;
            startDate: Date;
            endDate: Date;
        }[];
    }>;
    getAdDetails(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            title: string;
            mediaUrls: import("@prisma/client/runtime/library").JsonValue;
            bodyText: string | null;
            linkUrl: string | null;
            targetAudience: import(".prisma/client").$Enums.ad_target;
            adFee: import("@prisma/client/runtime/library").Decimal | null;
            sortOrder: number | null;
            startDate: Date | null;
            endDate: Date | null;
            isActive: boolean;
            createdBy: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    recordView(req: any, id: string): Promise<{
        success: boolean;
    }>;
}
