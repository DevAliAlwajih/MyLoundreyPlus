import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
export declare class BookingCustomerController {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    createBooking(req: any, dto: CreateBookingDto): Promise<{
        success: boolean;
        data: {
            id: string;
            laundries: {
                id: string;
                name: string;
                phoneNumber: string;
                city: string;
                logoUrl: string;
            };
            status: string;
            invoice_id: string;
            created_at: Date;
            notes: string;
            booking_date: Date;
            booking_time: Date;
        };
    }>;
    getMyBookings(req: any, query: QueryBookingDto): Promise<{
        success: boolean;
        data: {
            id: string;
            laundries: {
                id: string;
                name: string;
                phoneNumber: string;
                city: string;
                logoUrl: string;
            };
            status: string;
            invoice_id: string;
            created_at: Date;
            notes: string;
            booking_date: Date;
            booking_time: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getMyBooking(req: any, id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            laundries: {
                id: string;
                name: string;
                phoneNumber: string;
                city: string;
                logoUrl: string;
            };
            status: string;
            invoice_id: string;
            created_at: Date;
            notes: string;
            booking_date: Date;
            booking_time: Date;
        };
    }>;
    cancelBooking(req: any, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
export declare class BookingLaundryController {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    private getLaundryId;
    getLaundryBookings(req: any, query: QueryBookingDto): Promise<{
        success: boolean;
        data: {
            id: string;
            users: {
                id: string;
                phoneNumber: string;
                uniqueId: string;
                fullName: string;
            };
            status: string;
            invoice_id: string;
            created_at: Date;
            notes: string;
            booking_date: Date;
            booking_time: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getLaundryBooking(req: any, id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            users: {
                id: string;
                phoneNumber: string;
                uniqueId: string;
                fullName: string;
            };
            status: string;
            invoice_id: string;
            created_at: Date;
            notes: string;
            booking_date: Date;
            booking_time: Date;
        };
    }>;
    updateBookingStatus(req: any, id: string, dto: UpdateBookingStatusDto): Promise<{
        success: boolean;
        data: {
            status: string;
        };
    }>;
}
