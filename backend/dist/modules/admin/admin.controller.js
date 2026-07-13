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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const query_admin_dto_1 = require("./dto/query-admin.dto");
const update_laundry_status_dto_1 = require("./dto/update-laundry-status.dto");
const update_user_status_dto_1 = require("./dto/update-user-status.dto");
const update_setting_dto_1 = require("./dto/update-setting.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    getOverview() {
        return this.adminService.getOverview();
    }
    getRevenueAnalytics() {
        return this.adminService.getRevenueAnalytics();
    }
    getTopLaundries() {
        return this.adminService.getTopLaundries();
    }
    getSettings() {
        return this.adminService.getSettings();
    }
    updateSetting(req, key, dto) {
        return this.adminService.updateSetting(key, dto.value, req.user.id);
    }
    getLaundries(dto) {
        return this.adminService.getLaundries(dto);
    }
    getLaundryDetails(id) {
        return this.adminService.getLaundryDetails(id);
    }
    updateLaundryStatus(req, id, dto) {
        return this.adminService.updateLaundryStatus(id, req.user.id, dto);
    }
    getLaundryDevices(id) {
        return this.adminService.getLaundryDevices(id);
    }
    toggleLaundryDevice(id, deviceId, isActive) {
        return this.adminService.toggleDeviceByLaundryId(id, deviceId, isActive);
    }
    getUsers(dto) {
        return this.adminService.getUsers(dto);
    }
    getUserDetails(id) {
        return this.adminService.getUserDetails(id);
    }
    updateUserStatus(req, id, dto) {
        return this.adminService.updateUserStatus(id, req.user.id, dto);
    }
    getUserDevices(id) {
        return this.adminService.getUserDevices(id);
    }
    toggleUserDevice(id, deviceId, isActive) {
        return this.adminService.toggleDevice(id, deviceId, isActive);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get overview analytics' }),
    (0, common_1.Get)('analytics/overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getOverview", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get revenue analytics' }),
    (0, common_1.Get)('analytics/revenue'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getRevenueAnalytics", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get top laundries' }),
    (0, common_1.Get)('analytics/laundries'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getTopLaundries", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get system settings' }),
    (0, common_1.Get)('settings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getSettings", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update system setting' }),
    (0, common_1.Patch)('settings/:key'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('key')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_setting_dto_1.UpdateSettingDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateSetting", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get all laundries' }),
    (0, common_1.Get)('laundries'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_admin_dto_1.QueryAdminLaundriesDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getLaundries", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get laundry details' }),
    (0, common_1.Get)('laundries/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getLaundryDetails", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update laundry status' }),
    (0, common_1.Patch)('laundries/:id/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_laundry_status_dto_1.UpdateLaundryStatusDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateLaundryStatus", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get laundry devices' }),
    (0, common_1.Get)('laundries/:id/devices'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getLaundryDevices", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Toggle laundry device status' }),
    (0, common_1.Patch)('laundries/:id/devices/:deviceId'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('deviceId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)('isActive', common_1.ParseBoolPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "toggleLaundryDevice", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get all users' }),
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_admin_dto_1.QueryAdminUsersDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get user details' }),
    (0, common_1.Get)('users/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUserDetails", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update user status' }),
    (0, common_1.Patch)('users/:id/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_user_status_dto_1.UpdateUserStatusDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateUserStatus", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get user devices' }),
    (0, common_1.Get)('users/:id/devices'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUserDevices", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Toggle user device status' }),
    (0, common_1.Patch)('users/:id/devices/:deviceId'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('deviceId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)('isActive', common_1.ParseBoolPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "toggleUserDevice", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map