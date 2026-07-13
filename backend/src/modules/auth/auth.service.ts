import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ─────────────────────────────────────────────────────
  // 1. POST /auth/register — تسجيل بإيميل + كلمة مرور
  // ─────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    try {
      const normalizedEmail = (dto.email || '').toLowerCase().trim();
      // التحقق من الإيميل قبل الـ transaction
      const existingEmail = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingEmail) {
        throw new ConflictException({
          message  : 'البريد الإلكتروني مسجل مسبقاً',
          errorCode: 'EMAIL_ALREADY_EXISTS',
        });
      }

      // التحقق من رقم الهاتف قبل الـ transaction
      const fullPhone = `${dto.countryCode}${dto.phone}`;
      const existingPhone = await this.prisma.user.findUnique({ where: { phoneNumber: fullPhone } });
      if (existingPhone) {
        throw new ConflictException({
          message  : 'رقم الهاتف مسجل مسبقاً',
          errorCode: 'PHONE_ALREADY_EXISTS',
        });
      }

      const password_hash = await bcrypt.hash(dto.password, 10);
      const uniqueId = this.generateUniqueId();

      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            fullName     : dto.fullName,
            email        : normalizedEmail,
            password_hash,
            phoneNumber  : fullPhone,
            country      : dto.countryCode,
            uniqueId,
            role         : 'laundry',
            isVerified   : false,
          },
        });

        await tx.laundry.create({
          data: {
            name       : dto.laundryName,
            phoneNumber: fullPhone,
            ownerId    : user.id,
            status     : 'pending',
          },
        });

        // إرسال OTP للتحقق من الإيميل
        try {
          await this.sendOTP(normalizedEmail);
        } catch (emailError: any) {
          // Log but don't throw — registration succeeded even if email fails
          console.warn('OTP email failed (non-blocking):', emailError.message);
        }

        const tokens = await this.generateTokens(user);
        return {
          success: true,
          data   : {
            ...tokens,
            message: 'تم التسجيل بنجاح. تحقق من بريدك الإلكتروني لتفعيل الحساب',
          },
        };
      });
    } catch (error: any) {
      // أعد رمي الاستثناء — GlobalExceptionFilter سيتعامل معه
      this.logger.error(`Register failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────
  // 2. POST /auth/login — تسجيل دخول بإيميل + كلمة مرور
  // ─────────────────────────────────────────────────────
  async login(email: string, password: string, deviceInfo?: any) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    this.logger.warn(`[Login Attempt] Original Email: '${email}', Normalized: '${normalizedEmail}'`);
    
    const user = await this.prisma.user.findFirst({ 
      where: { 
        email: {
          equals: normalizedEmail,
          mode: 'insensitive', // Ignore case in DB just in case
        }
      } 
    });

    this.logger.warn(`[Login Attempt] User found? ${!!user}`);

    // فحص وجود المستخدم — نفس رسالة كلمة المرور الخاطئة (أمان)
    if (!user || !user.password_hash) {
      this.logger.warn(`[Login Attempt] Failed: user is null or missing password_hash`);
      throw new UnauthorizedException({
        message  : 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        errorCode: 'INVALID_CREDENTIALS',
      });
    }

    // فحص الحساب موقوف قبل bcrypt (تحسين الأداء)
    if (!user.isActive) {
      throw new ForbiddenException({
        message  : 'هذا الحساب معلّق، تواصل مع الدعم',
        errorCode: 'ACCOUNT_SUSPENDED',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException({
        message  : 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
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

  // ─── TEMP DEBUG METHOD ───
  async debugUser(email: string) {
    const originalEmail = email;
    const normalizedEmail = (email || '').toLowerCase().trim();
    
    // Find exactly as entered
    const exactUser = await this.prisma.user.findFirst({ where: { email: originalEmail } });
    
    // Find ignoring case
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

  // ─────────────────────────────────────────────────────
  // 3. POST /auth/otp/send — إرسال OTP على الإيميل
  // ─────────────────────────────────────────────────────
  async sendOTP(email: string) {
    const normalizedEmail = (email || '').toLowerCase().trim();

    // Rate Limiting: max 3 محاولات في الساعة
    const rateLimitKey = `rate:otp:${normalizedEmail}`;
    const attempts = await this.redis.incr(rateLimitKey);
    if (attempts === 1) await this.redis.expire(rateLimitKey, 3600);
    if (attempts > 3) {
      throw new ForbiddenException({
        message  : 'عدد المحاولات تجاوز الحد المسموح، حاول بعد ساعة',
        errorCode: 'OTP_MAX_ATTEMPTS',
      });
    }

    // توليد OTP 6 أرقام
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // تخزين في Redis — صلاحية 10 دقائق (600 ثانية)
    const otpKey = `otp:${normalizedEmail}`;
    await this.redis.set(otpKey, otp, 600);

    if (process.env.EMAIL_SENDING_ENABLED !== 'true') {
      this.logger.log(`🔑 OTP for ${normalizedEmail}: ${otp}`);
      return { success: true, message: 'تم إرسال رمز التحقق على بريدك الإلكتروني' };
    }

    // إرسال على الإيميل
    await this.sendOtpEmail(normalizedEmail, otp);

    return { success: true, message: 'تم إرسال رمز التحقق على بريدك الإلكتروني' };
  }

  // ─────────────────────────────────────────────────────
  // 4. POST /auth/otp/verify — التحقق من OTP
  // ─────────────────────────────────────────────────────
  async verifyOTP(email: string, otp: string, deviceInfo?: any) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const otpKey = `otp:${normalizedEmail}`;
    const storedOtp = await this.redis.get(otpKey);

    // فصل حالتَي: منتهي الصلاحية (لا يوجد في Redis) عن: رمز خاطئ
    if (!storedOtp) {
      throw new BadRequestException({
        message  : 'انتهت صلاحية رمز التحقق، اطلب رمزاً جديداً',
        errorCode: 'OTP_EXPIRED',
      });
    }

    if (storedOtp !== otp) {
      throw new BadRequestException({
        message  : 'رمز التحقق غير صحيح',
        errorCode: 'OTP_INVALID',
      });
    }

    // حذف الـ OTP بعد التحقق الناجح
    await this.redis.del(otpKey);

    // البحث أو إنشاء المستخدم
    let user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      // مستخدم جديد — تسجيل تلقائي
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
    } else {
      // تحديث حالة التحقق وآخر دخول
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

  // ─────────────────────────────────────────────────────
  // 4.5 POST /auth/password/reset — استعادة كلمة المرور
  // ─────────────────────────────────────────────────────
  async resetPassword(email: string, otp: string, newPassword: string) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const otpKey = `otp:${normalizedEmail}`;
    const storedOtp = await this.redis.get(otpKey);

    if (!storedOtp) {
      throw new BadRequestException({
        message  : 'انتهت صلاحية رمز التحقق، اطلب رمزاً جديداً',
        errorCode: 'OTP_EXPIRED',
      });
    }

    if (storedOtp !== otp) {
      throw new BadRequestException({
        message  : 'رمز التحقق غير صحيح',
        errorCode: 'OTP_INVALID',
      });
    }

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });

    if (!user) {
      throw new NotFoundException({
        message  : 'البريد الإلكتروني غير مسجل',
        errorCode: 'EMAIL_NOT_FOUND',
      });
    }

    // تشفير كلمة المرور الجديدة
    const password_hash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password_hash },
    });

    // حذف الـ OTP بعد الاستخدام الناجح
    await this.redis.del(otpKey);

    return { success: true, message: 'تم تحديث كلمة المرور بنجاح' };
  }

  // ─────────────────────────────────────────────────────
  // 5. POST /auth/admin/login — تسجيل دخول الأدمن
  // ─────────────────────────────────────────────────────
  async adminLogin(email: string, password: string) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail, role: 'admin' },
    });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException({
        message  : 'بيانات الدخول غير صحيحة',
        errorCode: 'INVALID_CREDENTIALS',
      });
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        message  : 'هذا الحساب معلّق',
        errorCode: 'ACCOUNT_SUSPENDED',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException({
        message  : 'بيانات الدخول غير صحيحة',
        errorCode: 'INVALID_CREDENTIALS',
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens(user);
  }

  // ─────────────────────────────────────────────────────
  // 6. POST /auth/refresh — تجديد الـ Access Token
  // ─────────────────────────────────────────────────────
  async refreshToken(refreshToken: string) {
    // لا نلتقط استثناءات JWT هنا — GlobalExceptionFilter سيتعامل مع
    // TokenExpiredError و JsonWebTokenError مباشرة
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });

    const user = await this.prisma.user.findUnique({
      where : { id: payload.sub },
      select: { id: true, fullName: true, role: true, uniqueId: true, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException({
        message  : 'المستخدم غير موجود',
        errorCode: 'INVALID_TOKEN',
      });
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        message  : 'هذا الحساب معلّق، تواصل مع الدعم',
        errorCode: 'ACCOUNT_SUSPENDED',
      });
    }

    return this.generateTokens(user);
  }

  // ─────────────────────────────────────────────────────
  // 7. PATCH /auth/me — تحديث بيانات المستخدم (الاسم فقط)
  // ─────────────────────────────────────────────────────
  async updateMe(userId: string, dto: import('./dto/update-me.dto').UpdateMeDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { fullName: dto.fullName },
      select: { id: true, fullName: true, email: true, role: true, uniqueId: true },
    });
    return { success: true, data: user };
  }

  // ─────────────────────────────────────────────────────
  // 8. POST /auth/me/email/request — طلب تغيير الإيميل
  // ─────────────────────────────────────────────────────
  async requestEmailChange(userId: string, newEmail: string) {
    const normalizedNewEmail = (newEmail || '').toLowerCase().trim();
    // 1. التحقق من أن الإيميل الجديد غير مستخدم
    const existingEmail = await this.prisma.user.findUnique({ where: { email: normalizedNewEmail } });
    if (existingEmail) {
      throw new ConflictException({
        message  : 'البريد الإلكتروني مستخدم مسبقاً',
        errorCode: 'EMAIL_ALREADY_EXISTS',
      });
    }

    // 2. تخزين الإيميل الجديد مؤقتاً في Redis (صلاحية 10 دقائق)
    const redisKey = `email_change:${userId}`;
    await this.redis.set(redisKey, normalizedNewEmail, 600);

    // 3. إرسال OTP
    await this.sendOTP(normalizedNewEmail);

    return { success: true, message: 'تم إرسال رمز التحقق للإيميل الجديد' };
  }

  // ─────────────────────────────────────────────────────
  // 9. POST /auth/me/email/confirm — تأكيد تغيير الإيميل
  // ─────────────────────────────────────────────────────
  async confirmEmailChange(userId: string, newEmail: string, otp: string) {
    // 1. التحقق أن هذا هو الإيميل المطلوب
    const redisKey = `email_change:${userId}`;
    const storedEmail = await this.redis.get(redisKey);
    
    if (!storedEmail || storedEmail !== newEmail) {
      throw new BadRequestException({
        message  : 'طلب تغيير البريد الإلكتروني غير صالح أو منتهي الصلاحية',
        errorCode: 'INVALID_EMAIL_CHANGE_REQUEST',
      });
    }

    // 2. التحقق من OTP
    const otpKey = `otp:${newEmail}`;
    const storedOtp = await this.redis.get(otpKey);

    if (!storedOtp) {
      throw new BadRequestException({
        message  : 'انتهت صلاحية رمز التحقق، اطلب رمزاً جديداً',
        errorCode: 'OTP_EXPIRED',
      });
    }

    if (storedOtp !== otp) {
      throw new BadRequestException({
        message  : 'رمز التحقق غير صحيح',
        errorCode: 'OTP_INVALID',
      });
    }

    // 3. تحديث قاعدة البيانات
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
      select: { id: true, fullName: true, email: true, role: true, uniqueId: true },
    });

    // 4. مسح بيانات Redis
    await this.redis.del(redisKey);
    await this.redis.del(otpKey);

    return { success: true, data: user, message: 'تم تغيير البريد الإلكتروني بنجاح' };
  }

  // ─────────────────────────────────────────────────────
  // 7. Google OAuth — handleGoogleLogin
  //    يُستدعى من GoogleStrategy بعد التحقق
  // ─────────────────────────────────────────────────────
  async handleGoogleLogin(googleProfile: {
    googleId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  }) {
    // البحث بـ google_id أولاً
    let user = await this.prisma.user.findFirst({
      where: { google_id: googleProfile.googleId },
    });

    if (!user) {
      // البحث بالإيميل (ربما سجّل مسبقاً بإيميل/OTP)
      user = await this.prisma.user.findUnique({
        where: { email: googleProfile.email },
      });

      if (user) {
        // ربط الـ google_id بالحساب الموجود
        await this.prisma.user.update({
          where: { id: user.id },
          data: { google_id: googleProfile.googleId, isVerified: true },
        });
      } else {
        // إنشاء حساب جديد
        const uniqueId = this.generateUniqueId();
        user = await this.prisma.user.create({
          data: {
            email      : googleProfile.email,
            fullName   : googleProfile.fullName,
            avatarUrl  : googleProfile.avatarUrl,
            google_id  : googleProfile.googleId,
            uniqueId,
            role       : 'customer',
            isVerified : true,
          },
        });
      }
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    return this.generateTokens(user);
  }

  // ─── Private Helpers ──────────────────────────────────

  private generateUniqueId() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private async generateTokens(user: any) {
    const payload = { sub: user.id, role: user.role };
    return {
      accessToken: await this.jwtService.signAsync(payload, {
        secret    : this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn : this.configService.get('JWT_ACCESS_EXPIRES_IN', '1h'),
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        secret    : this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn : this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
      user: {
        id      : user.id,
        fullName: user.fullName,
        email   : user.email,
        role    : user.role,
        uniqueId: user.uniqueId,
      },
    };
  }

  private async registerDevice(userId: string, info: any) {
    const deviceCount = await this.prisma.userDevice.count({ where: { userId } });
    const maxDevices  = 3;

    if (deviceCount >= maxDevices) {
      // TODO: سياسة إدارة الأجهزة — حالياً نسمح بالتجاوز
    }

    const isPrimary = deviceCount === 0;

    await this.prisma.userDevice.upsert({
      where: { id: info.deviceId || uuidv4() },
      update: {
        fcmToken   : info.fcmToken,
        lastLoginAt: new Date(),
        isActive   : true,
      },
      create: {
        id         : info.deviceId || uuidv4(),
        userId,
        deviceType : info.deviceType,
        deviceOs   : info.deviceOs,
        deviceModel: info.deviceModel,
        device_name: info.device_name,
        fcmToken   : info.fcmToken,
        isActive   : true,
        isPrimary,
      },
    });
  }

  /** إرسال OTP على الإيميل باستخدام nodemailer */
  private async sendOtpEmail(email: string, otp: string) {
    const smtpUser = this.configService.get<string>('MAIL_USER') || process.env.MAIL_USER;
    const smtpPass = this.configService.get<string>('MAIL_PASS') || process.env.MAIL_PASS;
    const fromName = this.configService.get<string>('SMTP_FROM_NAME', 'MyLoundreyPlus');
    const fromAddr = smtpUser;

    // إذا لم تُهيَّأ بيانات SMTP — اكتفِ بـ console.log (وضع التطوير)
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
      from   : `"${fromName}" <${fromAddr}>`,
      to     : email,
      subject: 'رمز التحقق — MyLoundreyPlus',
      html   : `
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
}
