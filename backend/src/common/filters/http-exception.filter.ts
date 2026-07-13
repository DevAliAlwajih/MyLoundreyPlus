import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

/**
 * GlobalExceptionFilter
 *
 * يعالج كل الاستثناءات ويُعيد shape موحّد:
 * { success, statusCode, message, errorCode, timestamp }
 *
 * ترتيب المعالجة:
 * 1. NestJS HttpException (BadRequest, Unauthorized, Conflict...)
 * 2. Prisma Known Errors (P2002 Unique, P2025 Not Found, P2003 FK)
 * 3. Prisma Validation Error (بنية خاطئة)
 * 4. Prisma Init Error (قاعدة البيانات غير متاحة)
 * 5. JWT TokenExpiredError
 * 6. JWT JsonWebTokenError
 * 7. أي خطأ آخر غير متوقع
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse();
    const request  = ctx.getRequest();

    let status    = HttpStatus.INTERNAL_SERVER_ERROR;
    let message   = 'حدث خطأ في الخادم، حاول لاحقاً';
    let errorCode = 'INTERNAL_ERROR';

    // ════════════════════════════════════════════════════
    // 1. NestJS HttpException
    //    (BadRequest 400, Unauthorized 401, Conflict 409…)
    // ════════════════════════════════════════════════════
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message   = res;
        errorCode = this.inferErrorCode(status);
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;

        // ValidationPipe يُعيد message كـ array من النصوص الإنجليزية
        // نُبقيها في اللوق ولكن نُرجع VALIDATION_ERROR للموبايل فقط
        if (Array.isArray(resObj.message)) {
          this.logger.warn(`Validation errors: ${resObj.message.join(' | ')}`);
          message   = resObj.message[0]; // للوق فقط
          errorCode = 'VALIDATION_ERROR';
        } else {
          // auth.service.ts يُرمي { message, errorCode } مباشرة
          message   = resObj.message   ?? message;
          errorCode = resObj.errorCode ?? this.inferErrorCode(status);
        }
      }
    }

    // ════════════════════════════════════════════════════
    // 2. Prisma — Known Request Error
    // ════════════════════════════════════════════════════
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(`Prisma Error [${exception.code}]: ${exception.message}`);

      switch (exception.code) {
        case 'P2002': {
          // Unique constraint violation
          status = HttpStatus.CONFLICT;
          const targets = (exception.meta?.target as string[]) ?? [];
          if (targets.some((f) => f.includes('email'))) {
            message   = 'البريد الإلكتروني مسجل مسبقاً';
            errorCode = 'EMAIL_ALREADY_EXISTS';
          } else if (targets.some((f) => f.includes('phone'))) {
            message   = 'رقم الهاتف مسجل مسبقاً';
            errorCode = 'PHONE_ALREADY_EXISTS';
          } else {
            message   = 'بيانات مكررة';
            errorCode = 'DUPLICATE_ENTRY';
          }
          break;
        }
        case 'P2025':
          status    = HttpStatus.NOT_FOUND;
          message   = 'السجل غير موجود';
          errorCode = 'RECORD_NOT_FOUND';
          break;
        case 'P2003':
          status    = HttpStatus.BAD_REQUEST;
          message   = 'مرجع غير صالح في البيانات المرسلة';
          errorCode = 'FOREIGN_KEY_ERROR';
          break;
        default:
          this.logger.error(`Unhandled Prisma error code: ${exception.code}`);
          break;
      }
    }

    // ════════════════════════════════════════════════════
    // 3. Prisma — Validation Error (بنية الاستعلام خاطئة)
    // ════════════════════════════════════════════════════
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.error(`Prisma Validation Error: ${exception.message}`);
      status    = HttpStatus.BAD_REQUEST;
      message   = 'خطأ في بنية البيانات المرسلة';
      errorCode = 'PRISMA_VALIDATION_ERROR';
    }

    // ════════════════════════════════════════════════════
    // 4. Prisma — Init Error (قاعدة البيانات غير متاحة)
    // ════════════════════════════════════════════════════
    else if (exception instanceof Prisma.PrismaClientInitializationError) {
      this.logger.error(`Prisma Init Error: ${exception.message}`);
      status    = HttpStatus.SERVICE_UNAVAILABLE;
      message   = 'تعذر الاتصال بقاعدة البيانات، حاول بعد قليل';
      errorCode = 'DATABASE_UNAVAILABLE';
    }

    // ════════════════════════════════════════════════════
    // 5. JWT — Token Expired
    // ════════════════════════════════════════════════════
    else if (exception instanceof TokenExpiredError) {
      status    = HttpStatus.UNAUTHORIZED;
      message   = 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً';
      errorCode = 'TOKEN_EXPIRED';
    }

    // ════════════════════════════════════════════════════
    // 6. JWT — Invalid / Malformed Token
    // ════════════════════════════════════════════════════
    else if (exception instanceof JsonWebTokenError) {
      status    = HttpStatus.UNAUTHORIZED;
      message   = 'جلسة غير صالحة';
      errorCode = 'INVALID_TOKEN';
    }

    // ════════════════════════════════════════════════════
    // 7. خطأ حقيقي غير متوقع — سجّل ولا تكشف التفاصيل
    // ════════════════════════════════════════════════════
    else {
      this.logger.error('Unhandled Exception:', exception);
    }

    // سجّل كل طلب فاشل بسطر واحد واضح
    this.logger.error(
      `[${request.method}] ${request.url} → ${status} | ${errorCode}`,
    );

    response.status(status).json({
      success   : false,
      statusCode: status,
      message,
      errorCode,
      timestamp : new Date().toISOString(),
    });
  }

  /** استنتاج errorCode من statusCode كـ fallback */
  private inferErrorCode(status: number): string {
    const map: Record<number, string> = {
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
}
