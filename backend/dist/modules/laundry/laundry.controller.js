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
exports.LaundryOwnerController = exports.LaundryPublicController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const laundry_service_1 = require("./laundry.service");
const query_laundry_dto_1 = require("./dto/query-laundry.dto");
const update_laundry_dto_1 = require("./dto/update-laundry.dto");
const category_dto_1 = require("./dto/category.dto");
const item_dto_1 = require("./dto/item.dto");
const create_holiday_dto_1 = require("./dto/create-holiday.dto");
const update_customer_profile_dto_1 = require("./dto/update-customer-profile.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const upload_service_1 = require("../../upload/upload.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let LaundryPublicController = class LaundryPublicController {
    constructor(laundryService) {
        this.laundryService = laundryService;
    }
    findAll(query) {
        return this.laundryService.findAll(query);
    }
    findOne(id) {
        return this.laundryService.findOne(id);
    }
    getMenu(id) {
        return this.laundryService.getMenu(id);
    }
};
exports.LaundryPublicController = LaundryPublicController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_laundry_dto_1.QueryLaundryDto]),
    __metadata("design:returntype", void 0)
], LaundryPublicController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LaundryPublicController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/menu'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LaundryPublicController.prototype, "getMenu", null);
exports.LaundryPublicController = LaundryPublicController = __decorate([
    (0, common_1.Controller)('laundries'),
    __metadata("design:paramtypes", [laundry_service_1.LaundryService])
], LaundryPublicController);
let LaundryOwnerController = class LaundryOwnerController {
    constructor(laundryService, uploadService, prisma) {
        this.laundryService = laundryService;
        this.uploadService = uploadService;
        this.prisma = prisma;
    }
    async uploadLogo(file, req) {
        if (!file)
            throw new common_1.BadRequestException('لم يتم إرسال أي صورة');
        const url = await this.uploadService.saveImage(file, 'laundry-logos');
        const laundry = await this.prisma.laundry.findFirst({
            where: { ownerId: req.user.id }
        });
        if (!laundry)
            throw new common_1.NotFoundException('المغسلة غير موجودة');
        await this.prisma.laundry.update({
            where: { id: laundry.id },
            data: { logoUrl: url },
        });
        return { success: true, data: { logoUrl: url } };
    }
    async deleteLogo(req) {
        const laundry = await this.prisma.laundry.findFirst({
            where: { ownerId: req.user.id }
        });
        if (!laundry)
            throw new common_1.NotFoundException('المغسلة غير موجودة');
        await this.prisma.laundry.update({
            where: { id: laundry.id },
            data: { logoUrl: null },
        });
        return { success: true, message: 'تم حذف الشعار بنجاح', data: { logoUrl: null } };
    }
    getMyLaundry(req) {
        return this.laundryService.getMyLaundry(req.user.id);
    }
    getReports(req, period, from, to) {
        return this.laundryService.getReports(req.user.id, period, from, to);
    }
    updateMyLaundry(req, dto) {
        return this.laundryService.updateMyLaundry(req.user.id, dto);
    }
    getMyMenu(req) {
        return this.laundryService.getMyMenu(req.user.id);
    }
    getWallet(req) {
        return this.laundryService.getWallet(req.user.id);
    }
    getWalletTransactions(req, page, limit) {
        const p = page ? parseInt(page, 10) : 1;
        const l = limit ? parseInt(limit, 10) : 20;
        return this.laundryService.getWalletTransactions(req.user.id, p, l);
    }
    createCategory(req, dto) {
        return this.laundryService.createCategory(req.user.id, dto);
    }
    updateCategory(req, id, dto) {
        return this.laundryService.updateCategory(req.user.id, id, dto);
    }
    deleteCategory(req, id) {
        return this.laundryService.deleteCategory(req.user.id, id);
    }
    createItem(req, dto) {
        return this.laundryService.createItem(req.user.id, dto.categoryId, dto);
    }
    updateItem(req, id, dto) {
        return this.laundryService.updateItem(req.user.id, id, dto);
    }
    deleteItem(req, id) {
        return this.laundryService.deleteItem(req.user.id, id);
    }
    upsertPrice(req, itemId, dto) {
        return this.laundryService.upsertPrice(req.user.id, itemId, dto);
    }
    getHolidays(req, upcoming) {
        const isUpcoming = upcoming === 'true';
        return this.laundryService.getHolidays(req.user.id, isUpcoming);
    }
    addHoliday(req, dto) {
        return this.laundryService.addHoliday(req.user.id, dto);
    }
    deleteHoliday(req, id) {
        return this.laundryService.deleteHoliday(req.user.id, id);
    }
    getCustomers(req, search, from_date, to_date, has_debt) {
        const hasDebtBool = has_debt === 'true';
        return this.laundryService.getCustomers(req.user.id, search, from_date, to_date, hasDebtBool);
    }
    getCustomerDetail(req, customerId) {
        return this.laundryService.getCustomerDetail(req.user.id, customerId);
    }
    remindCustomer(req, customerId, channel) {
        return this.laundryService.remindCustomer(req.user.id, customerId, channel);
    }
    updateCustomerProfile(req, customerId, dto) {
        return this.laundryService.updateCustomerProfile(req.user.id, customerId, dto);
    }
};
exports.LaundryOwnerController = LaundryOwnerController;
__decorate([
    (0, common_1.Post)('logo'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                cb(new common_1.BadRequestException('نوع الملف غير مدعوم — يُسمح فقط بـ jpg, jpeg, png, webp'), false);
            }
            else {
                cb(null, true);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LaundryOwnerController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Delete)('logo'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LaundryOwnerController.prototype, "deleteLogo", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "getMyLaundry", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('period')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "getReports", null);
__decorate([
    (0, common_1.Patch)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_laundry_dto_1.UpdateLaundryDto]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "updateMyLaundry", null);
__decorate([
    (0, common_1.Get)('menu'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "getMyMenu", null);
__decorate([
    (0, common_1.Get)('wallet'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "getWallet", null);
__decorate([
    (0, common_1.Get)('wallet/transactions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "getWalletTransactions", null);
__decorate([
    (0, common_1.Post)('categories'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, category_dto_1.CreateCategoryDto]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Patch)('categories/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, category_dto_1.UpdateCategoryDto]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Delete)('categories/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "deleteCategory", null);
__decorate([
    (0, common_1.Post)('items'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, item_dto_1.CreateItemDto]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "createItem", null);
__decorate([
    (0, common_1.Patch)('items/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, item_dto_1.UpdateItemDto]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Delete)('items/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "deleteItem", null);
__decorate([
    (0, common_1.Patch)('prices/:itemId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('itemId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, item_dto_1.UpdatePriceDto]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "upsertPrice", null);
__decorate([
    (0, common_1.Get)('holidays'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('upcoming')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "getHolidays", null);
__decorate([
    (0, common_1.Post)('holidays'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_holiday_dto_1.CreateHolidayDto]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "addHoliday", null);
__decorate([
    (0, common_1.Delete)('holidays/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "deleteHoliday", null);
__decorate([
    (0, common_1.Get)('customers'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('from_date')),
    __param(3, (0, common_1.Query)('to_date')),
    __param(4, (0, common_1.Query)('has_debt')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "getCustomers", null);
__decorate([
    (0, common_1.Get)('customers/:customerId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "getCustomerDetail", null);
__decorate([
    (0, common_1.Post)('customers/:customerId/remind'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('customerId')),
    __param(2, (0, common_1.Body)('channel')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "remindCustomer", null);
__decorate([
    (0, common_1.Patch)('customers/:customerId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('customerId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_customer_profile_dto_1.UpdateCustomerProfileDto]),
    __metadata("design:returntype", void 0)
], LaundryOwnerController.prototype, "updateCustomerProfile", null);
exports.LaundryOwnerController = LaundryOwnerController = __decorate([
    (0, common_1.Controller)('my-laundry'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('laundry'),
    __metadata("design:paramtypes", [laundry_service_1.LaundryService,
        upload_service_1.UploadService,
        prisma_service_1.PrismaService])
], LaundryOwnerController);
//# sourceMappingURL=laundry.controller.js.map