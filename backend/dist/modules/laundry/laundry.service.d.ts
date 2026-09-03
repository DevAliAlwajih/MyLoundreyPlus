import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { QueryLaundryDto } from './dto/query-laundry.dto';
import { UpdateLaundryDto } from './dto/update-laundry.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateItemDto, UpdateItemDto, UpdatePriceDto } from './dto/item.dto';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';
export declare class LaundryService {
    private readonly prisma;
    private readonly notificationService;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    findAll(query: QueryLaundryDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            nameAr: string;
            city: string;
            country: string;
            logoUrl: string;
            workingHours: Prisma.JsonValue;
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
            createdAt: Date;
            name: string;
            phoneNumber: string;
            country: string;
            nameAr: string;
            address: string;
            city: string;
            workingHours: Prisma.JsonValue;
            logoUrl: string;
            status: import(".prisma/client").$Enums.laundry_status;
            ratingCount: number;
        };
    }>;
    getMenu(laundryId: string): Promise<{
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
    getMyLaundry(ownerId: string): Promise<{
        success: boolean;
        data: {
            ratingAvg: number;
            latitude: number;
            longitude: number;
            id: string;
            createdAt: Date;
            name: string;
            phoneNumber: string;
            country: string;
            nameAr: string;
            address: string;
            city: string;
            workingHours: Prisma.JsonValue;
            logoUrl: string;
            status: import(".prisma/client").$Enums.laundry_status;
            ratingCount: number;
            tax_enabled: boolean;
            tax_rate: Prisma.Decimal;
            urgency_enabled: boolean;
            urgency_fee: Prisma.Decimal;
        };
    }>;
    updateMyLaundry(ownerId: string, dto: UpdateLaundryDto): Promise<{
        success: boolean;
        data: {
            ratingAvg: number;
            latitude: number;
            longitude: number;
            id: string;
            createdAt: Date;
            name: string;
            phoneNumber: string;
            country: string;
            nameAr: string;
            address: string;
            city: string;
            workingHours: Prisma.JsonValue;
            logoUrl: string;
            status: import(".prisma/client").$Enums.laundry_status;
            ratingCount: number;
            tax_enabled: boolean;
            tax_rate: Prisma.Decimal;
            urgency_enabled: boolean;
            urgency_fee: Prisma.Decimal;
        };
    }>;
    getMyMenu(ownerId: string): Promise<{
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
    createCategory(ownerId: string, dto: CreateCategoryDto): Promise<{
        success: boolean;
        data: {
            id: string;
            sortOrder: number;
            isActive: boolean;
            name: string;
        };
    }>;
    updateCategory(ownerId: string, categoryId: string, dto: UpdateCategoryDto): Promise<{
        success: boolean;
        data: {
            id: string;
            sortOrder: number;
            isActive: boolean;
            name: string;
        };
    }>;
    deleteCategory(ownerId: string, categoryId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    createItem(ownerId: string, categoryId: string, dto: CreateItemDto): Promise<{
        success: boolean;
        data: {
            basePrice: number;
            id: string;
            sortOrder: number;
            isActive: boolean;
            nameAr: string;
            nameEn: string;
            washing_price: Prisma.Decimal;
            ironing_price: Prisma.Decimal;
        };
    }>;
    updateItem(ownerId: string, itemId: string, dto: UpdateItemDto): Promise<{
        success: boolean;
        data: {
            basePrice: number;
            id: string;
            sortOrder: number;
            isActive: boolean;
            nameAr: string;
            nameEn: string;
            washing_price: Prisma.Decimal;
            ironing_price: Prisma.Decimal;
        };
    }>;
    deleteItem(ownerId: string, itemId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    upsertPrice(ownerId: string, itemId: string, dto: UpdatePriceDto): Promise<{
        success: boolean;
        data: {
            price: number;
            updatedAt: Date;
            itemId: string;
            isAvailable: boolean;
        };
    }>;
    getHolidays(ownerId: string, upcoming: boolean): Promise<{
        success: boolean;
        data: {
            date: string;
            id: string;
            reason: string;
        }[];
    }>;
    addHoliday(ownerId: string, dto: CreateHolidayDto): Promise<{
        success: boolean;
        data: {
            date: string;
            id: string;
            reason: string;
        };
    }>;
    deleteHoliday(ownerId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getWallet(ownerId: string): Promise<{
        success: boolean;
        data: {
            balance: number;
            billingType: import(".prisma/client").$Enums.billing_type;
            commissionRate: number;
            trialCommissionEndsAt: Date;
        };
    }>;
    getWalletTransactions(ownerId: string, page?: number, limit?: number): Promise<{
        success: boolean;
        data: {
            id: string;
            invoiceId: string;
            invoiceNumber: string;
            invoiceTotal: number;
            commissionRate: number;
            commissionAmount: number;
            balanceAfter: number;
            createdAt: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    private getLaundryByOwner;
    getReports(ownerId: string, period?: string, from?: string, to?: string): Promise<{
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
    getCustomers(ownerId: string, search?: string, from_date?: string, to_date?: string, has_debt?: boolean): Promise<{
        success: boolean;
        data: unknown;
    }>;
    getCustomerDetail(ownerId: string, customerId: string): Promise<{
        success: boolean;
        data: {
            customerId: string;
            customerName: string;
            customerPhone: string;
            notes: string;
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
    remindCustomer(ownerId: string, customerId: string, channel: 'whatsapp' | 'app' | 'both'): Promise<{
        success: boolean;
        message: string;
    }>;
    updateCustomerProfile(ownerId: string, customerId: string, dto: UpdateCustomerProfileDto): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            laundryId: string;
            customerId: string | null;
            notes: string | null;
            phone: string | null;
            localName: string | null;
            localPhone: string | null;
        };
    }>;
}
