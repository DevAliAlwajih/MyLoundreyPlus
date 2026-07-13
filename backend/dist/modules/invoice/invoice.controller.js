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
exports.InvoiceCustomerController = exports.InvoiceLaundryController = void 0;
const common_1 = require("@nestjs/common");
const invoice_service_1 = require("./invoice.service");
const create_invoice_dto_1 = require("./dto/create-invoice.dto");
const update_invoice_dto_1 = require("./dto/update-invoice.dto");
const update_invoice_status_dto_1 = require("./dto/update-invoice-status.dto");
const query_invoice_dto_1 = require("./dto/query-invoice.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let InvoiceLaundryController = class InvoiceLaundryController {
    constructor(invoiceService) {
        this.invoiceService = invoiceService;
    }
    create(req, dto) {
        return this.invoiceService.createInvoice(req.user.laundryId ?? req.user.id, dto);
    }
    findAll(req, query) {
        return this.invoiceService.findAll(req.user.laundryId ?? req.user.id, query);
    }
    findOne(req, id) {
        return this.invoiceService.findOne(id, req.user.laundryId ?? req.user.id);
    }
    update(req, id, dto) {
        return this.invoiceService.updateInvoice(id, req.user.laundryId ?? req.user.id, dto);
    }
    updateStatus(req, id, dto) {
        return this.invoiceService.updateStatus(id, req.user.laundryId ?? req.user.id, req.user.id, dto);
    }
    getPrintData(req, id) {
        return this.invoiceService.getPrintData(id, req.user.laundryId ?? req.user.id);
    }
};
exports.InvoiceLaundryController = InvoiceLaundryController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_invoice_dto_1.CreateInvoiceDto]),
    __metadata("design:returntype", void 0)
], InvoiceLaundryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_invoice_dto_1.QueryInvoiceDto]),
    __metadata("design:returntype", void 0)
], InvoiceLaundryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InvoiceLaundryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_invoice_dto_1.UpdateInvoiceDto]),
    __metadata("design:returntype", void 0)
], InvoiceLaundryController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_invoice_status_dto_1.UpdateInvoiceStatusDto]),
    __metadata("design:returntype", void 0)
], InvoiceLaundryController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)(':id/print'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InvoiceLaundryController.prototype, "getPrintData", null);
exports.InvoiceLaundryController = InvoiceLaundryController = __decorate([
    (0, common_1.Controller)('invoices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('laundry'),
    __metadata("design:paramtypes", [invoice_service_1.InvoiceService])
], InvoiceLaundryController);
let InvoiceCustomerController = class InvoiceCustomerController {
    constructor(invoiceService) {
        this.invoiceService = invoiceService;
    }
    findMyInvoices(req, query) {
        return this.invoiceService.findMyInvoices(req.user.id, query);
    }
    findMyInvoice(req, id) {
        return this.invoiceService.findMyInvoice(id, req.user.id);
    }
};
exports.InvoiceCustomerController = InvoiceCustomerController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_invoice_dto_1.QueryInvoiceDto]),
    __metadata("design:returntype", void 0)
], InvoiceCustomerController.prototype, "findMyInvoices", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InvoiceCustomerController.prototype, "findMyInvoice", null);
exports.InvoiceCustomerController = InvoiceCustomerController = __decorate([
    (0, common_1.Controller)('my-invoices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('customer'),
    __metadata("design:paramtypes", [invoice_service_1.InvoiceService])
], InvoiceCustomerController);
//# sourceMappingURL=invoice.controller.js.map