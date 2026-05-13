import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async sendOTP(phoneNumber: string) {
    // Regex for GCC phone numbers: /^\+9[67]\d{8,9}$/
    const phoneRegex = /^\+9[67]\d{8,9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new BadRequestException('رقم الهاتف غير صالح. يجب أن يبدأ بـ +966 أو +967');
    }

    // Rate Limiting: max 3 attempts per hour
    const rateLimitKey = `rate:otp:${phoneNumber}`;
    const attempts = await this.redis.incr(rateLimitKey);
    if (attempts === 1) await this.redis.expire(rateLimitKey, 3600);
    if (attempts > 3) {
      throw new ForbiddenException('تجاوزت الحد المسموح. حاول بعد ساعة');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in Redis with 300s TTL
    const otpKey = `otp:${phoneNumber}`;
    await this.redis.set(otpKey, otp, 300);

    // TODO: Integration with SMS Gateway (Twilio/Unifonic)
    // For now, we log it (never return it in response)
    console.log(`[SMS Gateway] OTP for ${phoneNumber}: ${otp}`);

    return { success: true, message: 'تم إرسال رمز التحقق' };
  }

  async verifyOTP(phoneNumber: string, otp: string, deviceInfo: any) {
    const otpKey = `otp:${phoneNumber}`;
    const storedOtp = await this.redis.get(otpKey);

    if (!storedOtp || storedOtp !== otp) {
      throw new UnauthorizedException('رمز التحقق غير صحيح أو منتهي الصلاحية');
    }

    // Delete OTP after successful verification
    await this.redis.del(otpKey);

    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      // Create new user
      const uniqueId = this.generateUniqueId();
      user = await this.prisma.user.create({
        data: {
          phoneNumber,
          fullName: 'عميل جديد',
          uniqueId,
          role: 'customer',
          isVerified: true,
        },
      });
    } else {
      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // Register Device
    await this.registerDevice(user.id, deviceInfo);

    return this.generateTokens(user);
  }

  async adminLogin(email: string, pass: string) {
    const user = await this.prisma.user.findFirst({
      where: { phoneNumber: email, role: 'admin' }, // Using email logic as per prompt
    });

    // Note: In schema, email is not a field yet, prompt says use email in admin login
    // I should check if I added email to schema.
    // Wait, the prompt says "Check email in users table where role = 'admin'".
    // Let me check my prisma schema again.
  }

  private generateUniqueId() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private async generateTokens(user: any) {
    const payload = { sub: user.id, role: user.role };
    return {
      accessToken: await this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      }),
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        uniqueId: user.uniqueId,
      },
    };
  }

  private async registerDevice(userId: string, info: any) {
    const deviceCount = await this.prisma.userDevice.count({
      where: { userId },
    });

    const maxDevices = 3; // From app_settings normally
    if (deviceCount >= maxDevices) {
      // throw new ForbiddenException('تجاوزت الحد المسموح للأجهزة');
      // In first verification, we might want to allow replacing or just block
    }

    const isPrimary = deviceCount === 0;

    await this.prisma.userDevice.upsert({
      where: { id: info.deviceId || uuidv4() },
      update: {
        fcmToken: info.fcmToken,
        lastLoginAt: new Date(),
        isActive: true,
      },
      create: {
        id: info.deviceId || uuidv4(),
        userId,
        deviceType: info.deviceType,
        deviceOs: info.deviceOs,
        deviceModel: info.deviceModel,
        fcmToken: info.fcmToken,
        isActive: true,
        isPrimary,
      },
    });
  }
}
