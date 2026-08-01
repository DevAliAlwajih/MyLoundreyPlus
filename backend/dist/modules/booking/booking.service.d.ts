import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
export declare class BookingService {
    private readonly prisma;
    private readonly notificationService;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    createBooking(customerId: string, dto: CreateBookingDto): Promise<{
        success: boolean;
        data: {
            id: string;
            laundries: {
                id: string;
                phoneNumber: string;
                name: string;
                city: string;
                logoUrl: string;
            };
            status: string;
            notes: string;
            booking_date: Date;
            booking_time: Date;
            invoice_id: string;
            created_at: Date;
        };
    }>;
    getMyBookings(customerId: string, query: QueryBookingDto): Promise<{
        success: boolean;
        data: {
            id: string;
            laundries: {
                id: string;
                phoneNumber: string;
                name: string;
                city: string;
                logoUrl: string;
            };
            status: string;
            notes: string;
            booking_date: Date;
            booking_time: Date;
            invoice_id: string;
            created_at: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getMyBooking(customerId: string, bookingId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            laundries: {
                id: string;
                phoneNumber: string;
                name: string;
                city: string;
                logoUrl: string;
            };
            status: string;
            notes: string;
            booking_date: Date;
            booking_time: Date;
            invoice_id: string;
            created_at: Date;
        };
    }>;
    cancelBooking(customerId: string, bookingId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getLaundryBookings(laundryId: string, query: QueryBookingDto): Promise<{
        success: boolean;
        data: {
            id: string;
            status: string;
            users: {
                id: string;
                phoneNumber: string;
                uniqueId: string;
                fullName: string;
            };
            notes: string;
            booking_date: Date;
            booking_time: Date;
            invoice_id: string;
            created_at: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getLaundryBooking(laundryId: string, bookingId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            status: string;
            users: {
                id: string;
                phoneNumber: string;
                uniqueId: string;
                fullName: string;
            };
            notes: string;
            booking_date: Date;
            booking_time: Date;
            invoice_id: string;
            created_at: Date;
        };
    }>;
    updateBookingStatus(laundryId: string, bookingId: string, dto: UpdateBookingStatusDto): Promise<{
        success: boolean;
        data: {
            status: string;
        };
    }>;
    private throwBookingNotFound;
}
