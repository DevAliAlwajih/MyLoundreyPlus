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
exports.PromotionController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const swagger_1 = require("@nestjs/swagger");
const promotion_service_1 = require("./promotion.service");
const create_promotion_dto_1 = require("./dto/create-promotion.dto");
const update_promotion_dto_1 = require("./dto/update-promotion.dto");
const query_promotion_dto_1 = require("./dto/query-promotion.dto");
const upload_service_1 = require("../../upload/upload.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const optional_jwt_auth_guard_1 = require("../auth/guards/optional-jwt-auth.guard");
let PromotionController = class PromotionController {
    constructor(promotionService, uploadService) {
        this.promotionService = promotionService;
        this.uploadService = uploadService;
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
    async uploadImage(file) {
        if (!file)
            throw new common_1.BadRequestException('لم يتم إرسال أي صورة');
        const url = await this.uploadService.saveImage(file, 'promotions');
        return { success: true, data: { url } };
    }
    getMyPromotions(req, query) {
        return this.promotionService.getMyPromotions(this.getLaundryId(req), query);
    }
    createPromotion(req, dto) {
        return this.promotionService.createPromotion(this.getLaundryId(req), dto);
    }
    togglePromotion(req, id) {
        return this.promotionService.togglePromotion(this.getLaundryId(req), id);
    }
    updatePromotion(req, id, dto) {
        return this.promotionService.updatePromotion(this.getLaundryId(req), id, dto);
    }
    deletePromotion(req, id) {
        return this.promotionService.deletePromotion(this.getLaundryId(req), id);
    }
    getLaundryPromotions(laundryId) {
        return this.promotionService.getLaundryPromotions(laundryId);
    }
    getPromotionDetails(id) {
        return this.promotionService.getPromotionDetails(id);
    }
    recordView(req, id) {
        const userId = req.user?.id;
        return this.promotionService.recordView(id, userId);
    }
};
exports.PromotionController = PromotionController;
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('laundry'),
    (0, swagger_1.ApiOperation)({ summary: 'Laundry: Upload promotion image' }),
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
                cb(new common_1.BadRequestException('نوع الملف غير مدعوم — يُسمح فقط بالصور (jpg, jpeg, png, webp)'), false);
            }
            else {
                cb(null, true);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PromotionController.prototype, "uploadImage", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('laundry'),
    (0, swagger_1.ApiOperation)({ summary: 'Laundry: Get my promotions' }),
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_promotion_dto_1.QueryPromotionDto]),
    __metadata("design:returntype", void 0)
], PromotionController.prototype, "getMyPromotions", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('laundry'),
    (0, swagger_1.ApiOperation)({ summary: 'Laundry: Create a new promotion' }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_promotion_dto_1.CreatePromotionDto]),
    __metadata("design:returntype", void 0)
], PromotionController.prototype, "createPromotion", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('laundry'),
    (0, swagger_1.ApiOperation)({ summary: 'Laundry: Toggle promotion active status' }),
    (0, common_1.Patch)(':id/toggle'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PromotionController.prototype, "togglePromotion", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('laundry'),
    (0, swagger_1.ApiOperation)({ summary: 'Laundry: Update a promotion' }),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_promotion_dto_1.UpdatePromotionDto]),
    __metadata("design:returntype", void 0)
], PromotionController.prototype, "updatePromotion", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('laundry'),
    (0, swagger_1.ApiOperation)({ summary: 'Laundry: Delete a promotion' }),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PromotionController.prototype, "deletePromotion", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Public: Get active promotions for a specific laundry' }),
    (0, common_1.Get)('laundry/:laundryId'),
    __param(0, (0, common_1.Param)('laundryId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PromotionController.prototype, "getLaundryPromotions", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Public: Get specific promotion details' }),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PromotionController.prototype, "getPromotionDetails", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Public: Record a view for a promotion' }),
    (0, common_1.Post)(':id/view'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PromotionController.prototype, "recordView", null);
exports.PromotionController = PromotionController = __decorate([
    (0, swagger_1.ApiTags)('Promotions'),
    (0, common_1.Controller)('promotions'),
    __metadata("design:paramtypes", [promotion_service_1.PromotionService,
        upload_service_1.UploadService])
], PromotionController);
//# sourceMappingURL=promotion.controller.js.map