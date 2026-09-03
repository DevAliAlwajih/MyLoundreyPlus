import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { QueryAdDto } from './dto/query-ad.dto';
export declare class AdsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getActiveAds(userRole?: string, audienceQuery?: string): Promise<{
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
    recordView(adId: string, userId?: string): Promise<{
        success: boolean;
    }>;
    createAd(adminId: string, dto: CreateAdDto): Promise<{
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
    toggleAd(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            isActive: boolean;
        };
    }>;
    getAllAdsForAdmin(dto: QueryAdDto): Promise<{
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
}
