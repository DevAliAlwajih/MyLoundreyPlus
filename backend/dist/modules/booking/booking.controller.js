"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingLaundryController = exports.BookingCustomerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const booking_service_1 = require("./booking.service");
const create_booking_dto_1 = require("./dto/create-booking.dto");
const update_booking_status_dto_1 = require("./dto/update-booking-status.dto");
const query_booking_dto_1 = require("./dto/query-booking.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let BookingCustomerController = class BookingCustomerController {
    constructor(bookingService) {
        this.bookingService = bookingService;
    }
    createBooking(req, dto) {
        return this.bookingService.createBooking(req.user.id, dto);
    }
    getMyBookings(req, query) {
        return this.bookingService.getMyBookings(req.user.id, query);
    }
    getMyBooking(req, id) {
        return this.bookingService.getMyBooking(req.user.id, id);
    }
    cancelBooking(req, id) {
        return this.bookingService.cancelBooking(req.user.id, id);
    }
};
exports.BookingCustomerController = BookingCustomerController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_booking_dto_1.CreateBookingDto]),
    __metadata("design:returntype", void 0)
], BookingCustomerController.prototype, "createBooking", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_booking_dto_1.QueryBookingDto]),
    __metadata("design:returntype", void 0)
], BookingCustomerController.prototype, "getMyBookings", null);
__decorate([
    (0, common_1.Get)('my/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingCustomerController.prototype, "getMyBooking", null);
__decorate([
    (0, common_1.Delete)('my/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingCustomerController.prototype, "cancelBooking", null);
exports.BookingCustomerController = BookingCustomerController = __decorate([
    (0, swagger_1.ApiTags)('Bookings (Customer)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('customer'),
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [booking_service_1.BookingService])
], BookingCustomerController);
let BookingLaundryController = class BookingLaundryController {
    constructor(bookingService) {
        this.bookingService = bookingService;
    }
    getLaundryId(req) {
        const laundryId = req.user.laundryId;
        if (!laundryId) {
            throw new common_1.ForbiddenException({
                success: false,
                error: { code: 'NO_LAUNDRY', message: 'حسابك غير مرتبط بمغسلة' },
            });
        }
        return laundryId;
    }
    getLaundryBookings(req, query) {
        return this.bookingService.getLaundryBookings(this.getLaundryId(req), query);
    }
    getLaundryBooking(req, id) {
        return this.bookingService.getLaundryBooking(this.getLaundryId(req), id);
    }
    updateBookingStatus(req, id, dto) {
        return this.bookingService.updateBookingStatus(this.getLaundryId(req), id, dto);
    }
};
exports.BookingLaundryController = BookingLaundryController;
__decorate([
    (0, common_1.Get)('laundry'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_booking_dto_1.QueryBookingDto]),
    __metadata("design:returntype", void 0)
], BookingLaundryController.prototype, "getLaundryBookings", null);
__decorate([
    (0, common_1.Get)('laundry/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingLaundryController.prototype, "getLaundryBooking", null);
__decorate([
    (0, common_1.Patch)('laundry/:id/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_booking_status_dto_1.UpdateBookingStatusDto]),
    __metadata("design:returntype", void 0)
], BookingLaundryController.prototype, "updateBookingStatus", null);
exports.BookingLaundryController = BookingLaundryController = __decorate([
    (0, swagger_1.ApiTags)('Bookings (Laundry Owner)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('laundry'),
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [booking_service_1.BookingService])
], BookingLaundryController);
//# sourceMappingURL=booking.controller.js.map