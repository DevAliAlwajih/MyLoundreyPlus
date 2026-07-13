import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { QueryAdDto } from './dto/query-ad.dto';
export declare class AdsController {
    private readonly adsService;
    constructor(adsService: AdsService);
    getAllAdsForAdmin(query: QueryAdDto): Promise<{
        success: boolean;
        data: {
            viewsCount: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number | null;
            isActive: boolean;
            title: string;
            startDate: Date | null;
            endDate: Date | null;
            createdBy: string | null;
            mediaUrls: import("@prisma/client/runtime/library").JsonValue;
            bodyText: string | null;
            linkUrl: string | null;
            targetAudience: import(".prisma/client").$Enums.ad_target;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    createAd(req: any, dto: CreateAdDto): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number | null;
            isActive: boolean;
            title: string;
            startDate: Date | null;
            endDate: Date | null;
            createdBy: string | null;
            mediaUrls: import("@prisma/client/runtime/library").JsonValue;
            bodyText: string | null;
            linkUrl: string | null;
            targetAudience: import(".prisma/client").$Enums.ad_target;
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
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number | null;
            isActive: boolean;
            title: string;
            startDate: Date | null;
            endDate: Date | null;
            createdBy: string | null;
            mediaUrls: import("@prisma/client/runtime/library").JsonValue;
            bodyText: string | null;
            linkUrl: string | null;
            targetAudience: import(".prisma/client").$Enums.ad_target;
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
            startDate: Date;
            endDate: Date;
            mediaUrls: import("@prisma/client/runtime/library").JsonValue;
            bodyText: string;
            linkUrl: string;
            targetAudience: import(".prisma/client").$Enums.ad_target;
        }[];
    }>;
    getAdDetails(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number | null;
            isActive: boolean;
            title: string;
            startDate: Date | null;
            endDate: Date | null;
            createdBy: string | null;
            mediaUrls: import("@prisma/client/runtime/library").JsonValue;
            bodyText: string | null;
            linkUrl: string | null;
            targetAudience: import(".prisma/client").$Enums.ad_target;
        };
    }>;
    recordView(req: any, id: string): Promise<{
        success: boolean;
    }>;
}
