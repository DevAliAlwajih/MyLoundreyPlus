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
exports.SupportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const support_service_1 = require("./support.service");
const create_ticket_dto_1 = require("./dto/create-ticket.dto");
const query_ticket_dto_1 = require("./dto/query-ticket.dto");
const update_ticket_dto_1 = require("./dto/update-ticket.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let SupportController = class SupportController {
    constructor(supportService) {
        this.supportService = supportService;
    }
    createTicket(req, dto) {
        return this.supportService.createTicket(req.user.id, req.user.role, dto);
    }
    getMyTickets(req, dto) {
        return this.supportService.getMyTickets(req.user.id, dto);
    }
    getMyTicketDetails(req, id) {
        return this.supportService.getMyTicketDetails(req.user.id, id);
    }
    getAllTickets(dto) {
        return this.supportService.getAllTickets(dto);
    }
    getTicketDetails(id) {
        return this.supportService.getTicketDetails(id);
    }
    replyToTicket(req, id, dto) {
        return this.supportService.replyToTicket(req.user.id, id, dto.reply);
    }
    updateTicketStatus(req, id, dto) {
        return this.supportService.updateTicketStatus(req.user.id, id, dto);
    }
};
exports.SupportController = SupportController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Customer/Laundry: Open a new ticket' }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_ticket_dto_1.CreateTicketDto]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "createTicket", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Customer/Laundry: Get my tickets' }),
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_ticket_dto_1.QueryTicketDto]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "getMyTickets", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Customer/Laundry: Get my ticket details' }),
    (0, common_1.Get)('my/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "getMyTicketDetails", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get all tickets' }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_ticket_dto_1.QueryTicketDto]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "getAllTickets", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get ticket details' }),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "getTicketDetails", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Reply to a ticket' }),
    (0, common_1.Patch)(':id/reply'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_ticket_dto_1.ReplyTicketDto]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "replyToTicket", null);
__decorate([
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update ticket status' }),
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_ticket_dto_1.UpdateTicketStatusDto]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "updateTicketStatus", null);
exports.SupportController = SupportController = __decorate([
    (0, swagger_1.ApiTags)('Support'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('support/tickets'),
    __metadata("design:paramtypes", [support_service_1.SupportService])
], SupportController);
//# sourceMappingURL=support.controller.js.map