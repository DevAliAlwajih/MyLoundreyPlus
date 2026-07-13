"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = require("jsonwebtoken");
let GlobalExceptionFilter = class GlobalExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger('GlobalExceptionFilter');
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'حدث خطأ في الخادم، حاول لاحقاً';
        let errorCode = 'INTERNAL_ERROR';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'string') {
                message = res;
                errorCode = this.inferErrorCode(status);
            }
            else if (typeof res === 'object' && res !== null) {
                const resObj = res;
                if (Array.isArray(resObj.message)) {
                    this.logger.warn(`Validation errors: ${resObj.message.join(' | ')}`);
                    message = resObj.message[0];
                    errorCode = 'VALIDATION_ERROR';
                }
                else {
                    message = resObj.message ?? message;
                    errorCode = resObj.errorCode ?? this.inferErrorCode(status);
                }
            }
        }
        else if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            this.logger.error(`Prisma Error [${exception.code}]: ${exception.message}`);
            switch (exception.code) {
                case 'P2002': {
                    status = common_1.HttpStatus.CONFLICT;
                    const targets = exception.meta?.target ?? [];
                    if (targets.some((f) => f.includes('email'))) {
                        message = 'البريد الإلكتروني مسجل مسبقاً';
                        errorCode = 'EMAIL_ALREADY_EXISTS';
                    }
                    else if (targets.some((f) => f.includes('phone'))) {
                        message = 'رقم الهاتف مسجل مسبقاً';
                        errorCode = 'PHONE_ALREADY_EXISTS';
                    }
                    else {
                        message = 'بيانات مكررة';
                        errorCode = 'DUPLICATE_ENTRY';
                    }
                    break;
                }
                case 'P2025':
                    status = common_1.HttpStatus.NOT_FOUND;
                    message = 'السجل غير موجود';
                    errorCode = 'RECORD_NOT_FOUND';
                    break;
                case 'P2003':
                    status = common_1.HttpStatus.BAD_REQUEST;
                    message = 'مرجع غير صالح في البيانات المرسلة';
                    errorCode = 'FOREIGN_KEY_ERROR';
                    break;
                default:
                    this.logger.error(`Unhandled Prisma error code: ${exception.code}`);
                    break;
            }
        }
        else if (exception instanceof client_1.Prisma.PrismaClientValidationError) {
            this.logger.error(`Prisma Validation Error: ${exception.message}`);
            status = common_1.HttpStatus.BAD_REQUEST;
            message = 'خطأ في بنية البيانات المرسلة';
            errorCode = 'PRISMA_VALIDATION_ERROR';
        }
        else if (exception instanceof client_1.Prisma.PrismaClientInitializationError) {
            this.logger.error(`Prisma Init Error: ${exception.message}`);
            status = common_1.HttpStatus.SERVICE_UNAVAILABLE;
            message = 'تعذر الاتصال بقاعدة البيانات، حاول بعد قليل';
            errorCode = 'DATABASE_UNAVAILABLE';
        }
        else if (exception instanceof jsonwebtoken_1.TokenExpiredError) {
            status = common_1.HttpStatus.UNAUTHORIZED;
            message = 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً';
            errorCode = 'TOKEN_EXPIRED';
        }
        else if (exception instanceof jsonwebtoken_1.JsonWebTokenError) {
            status = common_1.HttpStatus.UNAUTHORIZED;
            message = 'جلسة غير صالحة';
            errorCode = 'INVALID_TOKEN';
        }
        else {
            this.logger.error('Unhandled Exception:', exception);
        }
        this.logger.error(`[${request.method}] ${request.url} → ${status} | ${errorCode}`);
        response.status(status).json({
            success: false,
            statusCode: status,
            message,
            errorCode,
            timestamp: new Date().toISOString(),
        });
    }
    inferErrorCode(status) {
        const map = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            422: 'UNPROCESSABLE_ENTITY',
            429: 'TOO_MANY_REQUESTS',
            503: 'SERVICE_UNAVAILABLE',
        };
        return map[status] ?? 'UNKNOWN_ERROR';
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map