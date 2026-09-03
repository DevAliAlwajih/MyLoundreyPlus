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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../common/redis/redis.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const uuid_1 = require("uuid");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, redis, jwtService, configService) {
        this.prisma = prisma;
        this.redis = redis;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async register(dto) {
        try {
            const normalizedEmail = (dto.email || '').toLowerCase().trim();
            const existingEmail = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
            if (existingEmail) {
                throw new common_1.ConflictException({
                    message: 'البريد الإلكتروني مسجل مسبقاً',
                    errorCode: 'EMAIL_ALREADY_EXISTS',
                });
            }
            const fullPhone = `${dto.countryCode}${dto.phone}`;
            const existingPhone = await this.prisma.user.findUnique({ where: { phoneNumber: fullPhone } });
            if (existingPhone) {
                throw new common_1.ConflictException({
                    message: 'رقم الهاتف مسجل مسبقاً',
                    errorCode: 'PHONE_ALREADY_EXISTS',
                });
            }
            const password_hash = await bcrypt.hash(dto.password, 10);
            const uniqueId = this.generateUniqueId();
            return await this.prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        fullName: dto.fullName,
                        email: normalizedEmail,
                        password_hash,
                        phoneNumber: fullPhone,
                        country: dto.countryCode,
                        uniqueId,
                        role: 'laundry',
                        isVerified: false,
                    },
                });
                const [rateRow, balanceRow, trialDaysRow, debtLimitRow] = await Promise.all([
                    tx.app_settings.findUnique({ where: { key: 'default_commission_rate' } }),
                    tx.app_settings.findUnique({ where: { key: 'default_initial_balance' } }),
                    tx.app_settings.findUnique({ where: { key: 'default_trial_days' } }),
                    tx.app_settings.findUnique({ where: { key: 'default_debt_limit' } }),
                ]);
                const defaultRate = rateRow ? Number(rateRow.value) : 10;
                const initialBalance = balanceRow ? Number(balanceRow.value) : 2000;
                const trialDays = trialDaysRow ? Number(trialDaysRow.value) : 30;
                const debtLimit = debtLimitRow ? Number(debtLimitRow.value) : 5000;
                const trialEndsAt = new Date();
                trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
                await tx.laundry.create({
                    data: {
                        name: dto.laundryName,
                        phoneNumber: fullPhone,
                        ownerId: user.id,
                        status: 'pending',
                        billing_type: 'commission',
                        commission_rate: defaultRate,
                        balance: initialBalance,
                        debt_limit: debtLimit,
                        trial_commission_ends_at: trialEndsAt,
                    },
                });
                try {
                    await this.sendOTP(normalizedEmail);
                }
                catch (emailError) {
                    console.warn('OTP email failed (non-blocking):', emailError.message);
                }
                const tokens = await this.generateTokens(user);
                return {
                    success: true,
                    data: {
                        ...tokens,
                        message: 'تم التسجيل بنجاح. تحقق من بريدك الإلكتروني لتفعيل الحساب',
                    },
                };
            });
        }
        catch (error) {
            this.logger.error(`Register failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    async login(email, password, deviceInfo) {
        const normalizedEmail = (email || '').toLowerCase().trim();
        this.logger.warn(`[Login Attempt] Original Email: '${email}', Normalized: '${normalizedEmail}'`);
        const user = await this.prisma.user.findFirst({
            where: {
                email: {
                    equals: normalizedEmail,
                    mode: 'insensitive',
                }
            }
        });
        this.logger.warn(`[Login Attempt] User found? ${!!user}`);
        if (!user || !user.password_hash) {
            this.logger.warn(`[Login Attempt] Failed: user is null or missing password_hash`);
            throw new common_1.UnauthorizedException({
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
                errorCode: 'INVALID_CREDENTIALS',
            });
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException({
                message: 'هذا الحساب معلّق، تواصل مع الدعم',
                errorCode: 'ACCOUNT_SUSPENDED',
            });
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException({
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
                errorCode: 'INVALID_CREDENTIALS',
            });
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        if (deviceInfo) {
            await this.registerDevice(user.id, deviceInfo);
        }
        return this.generateTokens(user);
    }
    async debugUser(email) {
        const originalEmail = email;
        const normalizedEmail = (email || '').toLowerCase().trim();
        const exactUser = await this.prisma.user.findFirst({ where: { email: originalEmail } });
        const caseInsensitiveUser = await this.prisma.user.findFirst({
            where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
        });
        return {
            message: "Debug User Info",
            inputEmail: originalEmail,
            normalizedEmail: normalizedEmail,
            exactMatchFound: !!exactUser,
            exactMatchDetails: exactUser ? {
                id: exactUser.id,
                emailInDB: exactUser.email,
                isActive: exactUser.isActive,
                hasPassword: !!exactUser.password_hash,
            } : null,
            caseInsensitiveMatchFound: !!caseInsensitiveUser,
            caseInsensitiveDetails: caseInsensitiveUser ? {
                id: caseInsensitiveUser.id,
                emailInDB: caseInsensitiveUser.email,
                isActive: caseInsensitiveUser.isActive,
                hasPassword: !!caseInsensitiveUser.password_hash,
            } : null
        };
    }
    async sendOTP(email) {
        const normalizedEmail = (email || '').toLowerCase().trim();
        const rateLimitKey = `rate:otp:${normalizedEmail}`;
        const attempts = await this.redis.incr(rateLimitKey);
        if (attempts === 1)
            await this.redis.expire(rateLimitKey, 3600);
        if (attempts > 3) {
            throw new common_1.ForbiddenException({
                message: 'عدد المحاولات تجاوز الحد المسموح، حاول بعد ساعة',
                errorCode: 'OTP_MAX_ATTEMPTS',
            });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpKey = `otp:${normalizedEmail}`;
        await this.redis.set(otpKey, otp, 600);
        if (process.env.EMAIL_SENDING_ENABLED !== 'true') {
            this.logger.log(`🔑 OTP for ${normalizedEmail}: ${otp}`);
            return { success: true, message: 'تم إرسال رمز التحقق على بريدك الإلكتروني' };
        }
        await this.sendOtpEmail(normalizedEmail, otp);
        return { success: true, message: 'تم إرسال رمز التحقق على بريدك الإلكتروني' };
    }
    async verifyOTP(email, otp, deviceInfo) {
        const normalizedEmail = (email || '').toLowerCase().trim();
        const otpKey = `otp:${normalizedEmail}`;
        const storedOtp = await this.redis.get(otpKey);
        if (!storedOtp) {
            throw new common_1.BadRequestException({
                message: 'انتهت صلاحية رمز التحقق، اطلب رمزاً جديداً',
                errorCode: 'OTP_EXPIRED',
            });
        }
        if (storedOtp !== otp) {
            throw new common_1.BadRequestException({
                message: 'رمز التحقق غير صحيح',
                errorCode: 'OTP_INVALID',
            });
        }
        await this.redis.del(otpKey);
        let user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            const uniqueId = this.generateUniqueId();
            user = await this.prisma.user.create({
                data: {
                    email: normalizedEmail,
                    fullName: 'مستخدم جديد',
                    uniqueId,
                    role: 'customer',
                    isVerified: true,
                },
            });
        }
        else {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { isVerified: true, lastLoginAt: new Date() },
            });
        }
        if (deviceInfo) {
            await this.registerDevice(user.id, deviceInfo);
        }
        return this.generateTokens(user);
    }
    async resetPassword(email, otp, newPassword) {
        const normalizedEmail = (email || '').toLowerCase().trim();
        const otpKey = `otp:${normalizedEmail}`;
        const storedOtp = await this.redis.get(otpKey);
        if (!storedOtp) {
            throw new common_1.BadRequestException({
                message: 'انتهت صلاحية رمز التحقق، اطلب رمزاً جديداً',
                errorCode: 'OTP_EXPIRED',
            });
        }
        if (storedOtp !== otp) {
            throw new common_1.BadRequestException({
                message: 'رمز التحقق غير صحيح',
                errorCode: 'OTP_INVALID',
            });
        }
        const user = await this.prisma.user.findFirst({
            where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
        });
        if (!user) {
            throw new common_1.NotFoundException({
                message: 'البريد الإلكتروني غير مسجل',
                errorCode: 'EMAIL_NOT_FOUND',
            });
        }
        const password_hash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { password_hash },
        });
        await this.redis.del(otpKey);
        return { success: true, message: 'تم تحديث كلمة المرور بنجاح' };
    }
    async adminLogin(email, password) {
        const normalizedEmail = (email || '').toLowerCase().trim();
        const user = await this.prisma.user.findFirst({
            where: { email: normalizedEmail, role: 'admin' },
        });
        if (!user || !user.password_hash) {
            throw new common_1.UnauthorizedException({
                message: 'بيانات الدخول غير صحيحة',
                errorCode: 'INVALID_CREDENTIALS',
            });
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException({
                message: 'هذا الحساب معلّق',
                errorCode: 'ACCOUNT_SUSPENDED',
            });
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException({
                message: 'بيانات الدخول غير صحيحة',
                errorCode: 'INVALID_CREDENTIALS',
            });
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        return this.generateTokens(user);
    }
    async refreshToken(refreshToken) {
        const payload = await this.jwtService.verifyAsync(refreshToken, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
        });
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, fullName: true, role: true, uniqueId: true, isActive: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException({
                message: 'المستخدم غير موجود',
                errorCode: 'INVALID_TOKEN',
            });
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException({
                message: 'هذا الحساب معلّق، تواصل مع الدعم',
                errorCode: 'ACCOUNT_SUSPENDED',
            });
        }
        return this.generateTokens(user);
    }
    async updateMe(userId, dto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { fullName: dto.fullName },
            select: { id: true, fullName: true, email: true, role: true, uniqueId: true },
        });
        return { success: true, data: user };
    }
    async requestEmailChange(userId, newEmail) {
        const normalizedNewEmail = (newEmail || '').toLowerCase().trim();
        const existingEmail = await this.prisma.user.findUnique({ where: { email: normalizedNewEmail } });
        if (existingEmail) {
            throw new common_1.ConflictException({
                message: 'البريد الإلكتروني مستخدم مسبقاً',
                errorCode: 'EMAIL_ALREADY_EXISTS',
            });
        }
        const redisKey = `email_change:${userId}`;
        await this.redis.set(redisKey, normalizedNewEmail, 600);
        await this.sendOTP(normalizedNewEmail);
        return { success: true, message: 'تم إرسال رمز التحقق للإيميل الجديد' };
    }
    async confirmEmailChange(userId, newEmail, otp) {
        const redisKey = `email_change:${userId}`;
        const storedEmail = await this.redis.get(redisKey);
        if (!storedEmail || storedEmail !== newEmail) {
            throw new common_1.BadRequestException({
                message: 'طلب تغيير البريد الإلكتروني غير صالح أو منتهي الصلاحية',
                errorCode: 'INVALID_EMAIL_CHANGE_REQUEST',
            });
        }
        const otpKey = `otp:${newEmail}`;
        const storedOtp = await this.redis.get(otpKey);
        if (!storedOtp) {
            throw new common_1.BadRequestException({
                message: 'انتهت صلاحية رمز التحقق، اطلب رمزاً جديداً',
                errorCode: 'OTP_EXPIRED',
            });
        }
        if (storedOtp !== otp) {
            throw new common_1.BadRequestException({
                message: 'رمز التحقق غير صحيح',
                errorCode: 'OTP_INVALID',
            });
        }
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { email: newEmail },
            select: { id: true, fullName: true, email: true, role: true, uniqueId: true },
        });
        await this.redis.del(redisKey);
        await this.redis.del(otpKey);
        return { success: true, data: user, message: 'تم تغيير البريد الإلكتروني بنجاح' };
    }
    async handleGoogleLogin(googleProfile) {
        let user = await this.prisma.user.findFirst({
            where: { google_id: googleProfile.googleId },
        });
        if (!user) {
            user = await this.prisma.user.findUnique({
                where: { email: googleProfile.email },
            });
            if (user) {
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { google_id: googleProfile.googleId, isVerified: true },
                });
            }
            else {
                const uniqueId = this.generateUniqueId();
                user = await this.prisma.user.create({
                    data: {
                        email: googleProfile.email,
                        fullName: googleProfile.fullName,
                        avatarUrl: googleProfile.avatarUrl,
                        google_id: googleProfile.googleId,
                        uniqueId,
                        role: 'customer',
                        isVerified: true,
                    },
                });
            }
        }
        else {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
        }
        return this.generateTokens(user);
    }
    generateUniqueId() {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }
    async generateTokens(user) {
        const payload = { sub: user.id, role: user.role };
        return {
            accessToken: await this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_ACCESS_SECRET'),
                expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '1h'),
            }),
            refreshToken: await this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
            }),
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                uniqueId: user.uniqueId,
            },
        };
    }
    async registerDevice(userId, info) {
        const deviceCount = await this.prisma.userDevice.count({ where: { userId } });
        const maxDevices = 3;
        if (deviceCount >= maxDevices) {
        }
        const isPrimary = deviceCount === 0;
        await this.prisma.userDevice.upsert({
            where: { id: info.deviceId || (0, uuid_1.v4)() },
            update: {
                fcmToken: info.fcmToken,
                lastLoginAt: new Date(),
                isActive: true,
            },
            create: {
                id: info.deviceId || (0, uuid_1.v4)(),
                userId,
                deviceType: info.deviceType,
                deviceOs: info.deviceOs,
                deviceModel: info.deviceModel,
                device_name: info.device_name,
                fcmToken: info.fcmToken,
                isActive: true,
                isPrimary,
            },
        });
    }
    async sendOtpEmail(email, otp) {
        const smtpUser = this.configService.get('MAIL_USER') || process.env.MAIL_USER;
        const smtpPass = this.configService.get('MAIL_PASS') || process.env.MAIL_PASS;
        const fromName = this.configService.get('SMTP_FROM_NAME', 'MyLoundreyPlus');
        const fromAddr = smtpUser;
        if (!smtpUser || !smtpPass) {
            console.warn(`[OTP Email — SMTP not configured] To: ${email} | OTP: ${otp}`);
            return;
        }
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });
        await transporter.sendMail({
            from: `"${fromName}" <${fromAddr}>`,
            to: email,
            subject: 'رمز التحقق — MyLoundreyPlus',
            html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
          <h2 style="color: #1a1a2e;">مغسلتي اس بلس</h2>
          <p style="color: #555;">رمز التحقق الخاص بك هو:</p>
          <div style="font-size: 40px; font-weight: bold; letter-spacing: 8px; color: #4361ee; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #888; font-size: 14px;">صالح لمدة <strong>10 دقائق</strong> فقط</p>
          <p style="color: #aaa; font-size: 12px;">إذا لم تطلب هذا الرمز، تجاهل هذا البريد.</p>
        </div>
      `,
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map