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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const swagger_1 = require("@nestjs/swagger");
const chat_service_1 = require("./chat.service");
const upload_service_1 = require("../../upload/upload.service");
const send_message_dto_1 = require("./dto/send-message.dto");
const query_messages_dto_1 = require("./dto/query-messages.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let ChatController = class ChatController {
    constructor(chatService, uploadService) {
        this.chatService = chatService;
        this.uploadService = uploadService;
    }
    async uploadAttachment(file) {
        if (!file)
            throw new common_1.BadRequestException('لم يتم إرسال أي ملف');
        const url = await this.uploadService.saveImage(file, 'chat-attachments');
        return { success: true, data: { url, type: file.mimetype.includes('pdf') ? 'pdf' : 'image' } };
    }
    getSupportMessages(req, query) {
        return this.chatService.getSupportMessages(req.user.id, req.user.role, query);
    }
    sendMessageToSupport(req, dto) {
        return this.chatService.sendMessageToSupport(req.user.id, req.user.role, dto);
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
    getLaundryConversations(req) {
        return this.chatService.getLaundryConversations(this.getLaundryId(req));
    }
    getLaundryMessages(req, customerId, query) {
        return this.chatService.getLaundryMessages(this.getLaundryId(req), customerId, query);
    }
    sendMessageToCustomer(req, customerId, dto) {
        return this.chatService.sendMessageToCustomer(this.getLaundryId(req), customerId, dto);
    }
    markAsReadByLaundry(req, customerId) {
        return this.chatService.markAsReadByLaundry(this.getLaundryId(req), customerId);
    }
    getCustomerMessages(req, laundryId, query) {
        return this.chatService.getCustomerMessages(req.user.id, laundryId, query);
    }
    sendMessageToLaundry(req, laundryId, dto) {
        return this.chatService.sendMessageToLaundry(req.user.id, laundryId, dto);
    }
    markAsRead(req, laundryId) {
        return this.chatService.markAsRead(req.user.id, laundryId);
    }
    deleteMessage(req, messageId) {
        return this.chatService.deleteMessage(messageId, req.user.id);
    }
    getAdminSupportConversations() {
        return this.chatService.getAdminSupportConversations();
    }
    getAdminSupportMessages(type, targetId, query) {
        if (type !== 'customer' && type !== 'laundry') {
            throw new common_1.BadRequestException('Invalid type');
        }
        return this.chatService.getAdminSupportMessages(type, targetId, query);
    }
    sendMessageFromAdmin(req, type, targetId, dto) {
        if (type !== 'customer' && type !== 'laundry') {
            throw new common_1.BadRequestException('Invalid type');
        }
        return this.chatService.sendMessageFromAdmin(req.user.id, type, targetId, dto);
    }
    markAdminSupportMessagesAsRead(req, type, targetId) {
        if (type !== 'customer' && type !== 'laundry') {
            throw new common_1.BadRequestException('Invalid type');
        }
        return this.chatService.markAdminSupportMessagesAsRead(req.user.id, type, targetId);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('attachment', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|pdf)$/)) {
                cb(new common_1.BadRequestException('نوع الملف غير مدعوم — يُسمح فقط بـ الصور وملفات PDF'), false);
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
], ChatController.prototype, "uploadAttachment", null);
__decorate([
    (0, common_1.Get)('support/messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_messages_dto_1.QueryMessagesDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getSupportMessages", null);
__decorate([
    (0, common_1.Post)('support/messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "sendMessageToSupport", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('laundry'),
    (0, common_1.Get)('laundry/conversations'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getLaundryConversations", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('laundry'),
    (0, common_1.Get)('laundry/:customerId/messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('customerId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, query_messages_dto_1.QueryMessagesDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getLaundryMessages", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('laundry'),
    (0, common_1.Post)('laundry/:customerId/messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('customerId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "sendMessageToCustomer", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('laundry'),
    (0, common_1.Patch)('laundry/:customerId/read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('customerId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "markAsReadByLaundry", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('customer'),
    (0, common_1.Get)(':laundryId/messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('laundryId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, query_messages_dto_1.QueryMessagesDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getCustomerMessages", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('customer'),
    (0, common_1.Post)(':laundryId/messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('laundryId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "sendMessageToLaundry", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('customer'),
    (0, common_1.Patch)(':laundryId/read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('laundryId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Delete)('messages/:messageId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('messageId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)('admin/support/conversations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getAdminSupportConversations", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)('admin/support/:type/:targetId/messages'),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Param)('targetId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, query_messages_dto_1.QueryMessagesDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getAdminSupportMessages", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Post)('admin/support/:type/:targetId/messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('type')),
    __param(2, (0, common_1.Param)('targetId', common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "sendMessageFromAdmin", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Patch)('admin/support/:type/:targetId/read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('type')),
    __param(2, (0, common_1.Param)('targetId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "markAdminSupportMessagesAsRead", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('Chat'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        upload_service_1.UploadService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map