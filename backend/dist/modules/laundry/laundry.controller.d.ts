import { LaundryService } from './laundry.service';
import { QueryLaundryDto } from './dto/query-laundry.dto';
import { UpdateLaundryDto } from './dto/update-laundry.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateItemDto, UpdateItemDto, UpdatePriceDto } from './dto/item.dto';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UploadService } from '../../upload/upload.service';
import { PrismaService } from '../../prisma/prisma.service';
export declare class LaundryPublicController {
    private readonly laundryService;
    constructor(laundryService: LaundryService);
    findAll(query: QueryLaundryDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            nameAr: string;
            city: string;
            country: string;
            logoUrl: string;
            workingHours: import("@prisma/client/runtime/library").JsonValue;
            ratingAvg: number;
            ratingCount: number;
            distanceKm: number;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        success: boolean;
        data: {
            ratingAvg: number;
            latitude: number;
            longitude: number;
            id: string;
            name: string;
            nameAr: string;
            phoneNumber: string;
            address: string;
            city: string;
            country: string;
            workingHours: import("@prisma/client/runtime/library").JsonValue;
            logoUrl: string;
            status: import(".prisma/client").$Enums.laundry_status;
            ratingCount: number;
            createdAt: Date;
        };
    }>;
    getMenu(id: string): Promise<{
        success: boolean;
        data: {
            categoryId: string;
            categoryName: string;
            items: {
                itemId: string;
                nameAr: string;
                nameEn: string;
                price: number;
                isAvailable: boolean;
            }[];
        }[];
    }>;
}
export declare class LaundryOwnerController {
    private readonly laundryService;
    private readonly uploadService;
    private readonly prisma;
    constructor(laundryService: LaundryService, uploadService: UploadService, prisma: PrismaService);
    uploadLogo(file: Express.Multer.File, req: any): Promise<{
        success: boolean;
        data: {
            logoUrl: string;
        };
    }>;
    deleteLogo(req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            logoUrl: any;
        };
    }>;
    getMyLaundry(req: any): Promise<{
        success: boolean;
        data: {
            ratingAvg: number;
            latitude: number;
            longitude: number;
            id: string;
            name: string;
            nameAr: string;
            phoneNumber: string;
            address: string;
            city: string;
            country: string;
            workingHours: import("@prisma/client/runtime/library").JsonValue;
            logoUrl: string;
            status: import(".prisma/client").$Enums.laundry_status;
            ratingCount: number;
            createdAt: Date;
            tax_enabled: boolean;
            tax_rate: import("@prisma/client/runtime/library").Decimal;
            urgency_enabled: boolean;
            urgency_fee: import("@prisma/client/runtime/library").Decimal;
        };
    }>;
    getReports(req: any, period?: string, from?: string, to?: string): Promise<{
        success: boolean;
        data: {
            paymentBreakdown: {
                cash: number;
                card: number;
                deferred: number;
                electronic: number;
                total: number;
            };
            statusSummary: {
                completed: number;
                cancelled: number;
                processing: number;
            };
            totalOutstandingDebt: number;
        };
    }>;
    updateMyLaundry(req: any, dto: UpdateLaundryDto): Promise<{
        success: boolean;
        data: {
            ratingAvg: number;
            latitude: number;
            longitude: number;
            id: string;
            name: string;
            nameAr: string;
            phoneNumber: string;
            address: string;
            city: string;
            country: string;
            workingHours: import("@prisma/client/runtime/library").JsonValue;
            logoUrl: string;
            status: import(".prisma/client").$Enums.laundry_status;
            ratingCount: number;
            createdAt: Date;
            tax_enabled: boolean;
            tax_rate: import("@prisma/client/runtime/library").Decimal;
            urgency_enabled: boolean;
            urgency_fee: import("@prisma/client/runtime/library").Decimal;
        };
    }>;
    getMyMenu(req: any): Promise<{
        success: boolean;
        data: {
            categoryId: string;
            categoryName: string;
            sortOrder: number;
            isActive: boolean;
            items: {
                itemId: string;
                nameAr: string;
                nameEn: string;
                fullServicePrice: number;
                washingPrice: number;
                ironingPrice: number;
                isAvailable: boolean;
                isActive: boolean;
                sortOrder: number;
            }[];
        }[];
    }>;
    createCategory(req: any, dto: CreateCategoryDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            sortOrder: number;
            isActive: boolean;
        };
    }>;
    updateCategory(req: any, id: string, dto: UpdateCategoryDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            sortOrder: number;
            isActive: boolean;
        };
    }>;
    deleteCategory(req: any, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    createItem(req: any, dto: CreateItemDto): Promise<{
        success: boolean;
        data: {
            basePrice: number;
            id: string;
            nameAr: string;
            sortOrder: number;
            isActive: boolean;
            nameEn: string;
            washing_price: import("@prisma/client/runtime/library").Decimal;
            ironing_price: import("@prisma/client/runtime/library").Decimal;
        };
    }>;
    updateItem(req: any, id: string, dto: UpdateItemDto): Promise<{
        success: boolean;
        data: {
            basePrice: number;
            id: string;
            nameAr: string;
            sortOrder: number;
            isActive: boolean;
            nameEn: string;
            washing_price: import("@prisma/client/runtime/library").Decimal;
            ironing_price: import("@prisma/client/runtime/library").Decimal;
        };
    }>;
    deleteItem(req: any, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    upsertPrice(req: any, itemId: string, dto: UpdatePriceDto): Promise<{
        success: boolean;
        data: {
            price: number;
            updatedAt: Date;
            itemId: string;
            isAvailable: boolean;
        };
    }>;
    getHolidays(req: any, upcoming?: string): Promise<{
        success: boolean;
        data: {
            date: string;
            id: string;
            reason: string;
        }[];
    }>;
    addHoliday(req: any, dto: CreateHolidayDto): Promise<{
        success: boolean;
        data: {
            date: string;
            id: string;
            reason: string;
        };
    }>;
    deleteHoliday(req: any, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getCustomers(req: any, search?: string, from_date?: string, to_date?: string, has_debt?: string): Promise<{
        success: boolean;
        data: unknown;
    }>;
    getCustomerDetail(req: any, customerId: string): Promise<{
        success: boolean;
        data: {
            customerId: string;
            customerName: string;
            customerPhone: string;
            totalInvoices: number;
            completedInvoices: number;
            deferredBalance: number;
            lastVisit: string;
            totalSpent: number;
            invoices: {
                id: string;
                invoiceNumber: string;
                status: import(".prisma/client").$Enums.invoice_status;
                customerName: string;
                customerPhone: string;
                paymentType: import(".prisma/client").$Enums.payment_type;
                isUrgent: boolean;
                notes: string;
                subtotal: number;
                discountPercent: number;
                discountAmount: number;
                urgencyFeePercent: number;
                urgencyFeeAmount: number;
                taxPercent: number;
                taxAmount: number;
                total: number;
                paidAmount: number;
                dueAmount: number;
                items: {
                    id: string;
                    itemId: string;
                    itemName: string;
                    itemNameAr: string;
                    quantity: number;
                    unitPrice: number;
                    totalPrice: number;
                    notes: string;
                }[];
                statusHistory: any[];
                createdAt: string;
                expectedDeliveryAt: string;
            }[];
        };
    }>;
    remindCustomer(req: any, customerId: string, channel: 'whatsapp' | 'app' | 'both'): Promise<{
        success: boolean;
        message: string;
    }>;
}
