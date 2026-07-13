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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const send_otp_dto_1 = require("./dto/send-otp.dto");
const verify_otp_dto_1 = require("./dto/verify-otp.dto");
const admin_login_dto_1 = require("./dto/admin-login.dto");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
const refresh_token_dto_1 = require("./dto/refresh-token.dto");
const update_me_dto_1 = require("./dto/update-me.dto");
const request_email_change_dto_1 = require("./dto/request-email-change.dto");
const confirm_email_change_dto_1 = require("./dto/confirm-email-change.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const google_auth_guard_1 = require("./guards/google-auth.guard");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async register(dto) {
        return this.authService.register(dto);
    }
    async login(dto, req, ip) {
        const deviceInfo = {
            ipAddress: ip,
            userAgent: req.headers['user-agent'],
        };
        return this.authService.login(dto.email, dto.password, deviceInfo);
    }
    async debugUser(email) {
        return this.authService.debugUser(email);
    }
    async sendOtp(dto) {
        return this.authService.sendOTP(dto.email);
    }
    async verifyOtp(dto, req, ip) {
        const deviceInfo = {
            ...dto.deviceInfo,
            ipAddress: ip,
            userAgent: req.headers['user-agent'],
        };
        return this.authService.verifyOTP(dto.email, dto.otp, deviceInfo);
    }
    async resetPassword(dto) {
        return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
    }
    async refresh(dto) {
        return this.authService.refreshToken(dto.refreshToken);
    }
    async updateMe(req, dto) {
        return this.authService.updateMe(req.user.id, dto);
    }
    async requestEmailChange(req, dto) {
        return this.authService.requestEmailChange(req.user.id, dto.newEmail);
    }
    async confirmEmailChange(req, dto) {
        return this.authService.confirmEmailChange(req.user.id, dto.newEmail, dto.otp);
    }
    async adminLogin(dto) {
        return this.authService.adminLogin(dto.email, dto.password);
    }
    async googleAuth() {
    }
    async googleCallback(req, res) {
        const tokens = await this.authService.handleGoogleLogin(req.user);
        const frontendUrl = process.env.FRONTEND_APP_URL ?? 'http://localhost:8081';
        const { accessToken, refreshToken, user } = tokens;
        res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}&userId=${user.id}`);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('debug/:email'),
    __param(0, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "debugUser", null);
__decorate([
    (0, common_1.Post)('otp/send'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_otp_dto_1.SendOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sendOtp", null);
__decorate([
    (0, common_1.Post)('otp/verify'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_otp_dto_1.VerifyOtpDto, Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Post)('password/reset'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_me_dto_1.UpdateMeDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateMe", null);
__decorate([
    (0, common_1.Post)('me/email/request'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, request_email_change_dto_1.RequestEmailChangeDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestEmailChange", null);
__decorate([
    (0, common_1.Post)('me/email/confirm'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, confirm_email_change_dto_1.ConfirmEmailChangeDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "confirmEmailChange", null);
__decorate([
    (0, common_1.Post)('admin/login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_login_dto_1.AdminLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "adminLogin", null);
__decorate([
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map