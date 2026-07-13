import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. بيانات المستخدم الحالي
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        uniqueId: true,
        qrCode: true,
        avatarUrl: true,
        role: true,
        country: true,
        currency: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'المستخدم غير موجود' },
      });
    }

    return { success: true, data: user };
  }

  // 2. تحديث البيانات الشخصية
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.phoneNumber) {
      const existing = await this.prisma.user.findUnique({
        where: { phoneNumber: dto.phoneNumber },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException({
          success: false,
          error: { code: 'PHONE_ALREADY_EXISTS', message: 'رقم الهاتف مستخدم مسبقاً' },
        });
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        uniqueId: true,
        qrCode: true,
        avatarUrl: true,
        role: true,
        country: true,
        currency: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return { success: true, data: updated };
  }

  // 3. تغيير كلمة المرور
  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException({
        success: false,
        error: { code: 'PASSWORD_MISMATCH', message: 'كلمة المرور الجديدة وتأكيدها غير متطابقَين' },
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password_hash: true },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'المستخدم غير موجود' },
      });
    }

    if (!user.password_hash) {
      throw new BadRequestException({
        success: false,
        error: { code: 'GOOGLE_ACCOUNT_NO_PASSWORD', message: 'حسابك مرتبط بـ Google — لا يوجد كلمة مرور' },
      });
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'WRONG_CURRENT_PASSWORD', message: 'كلمة المرور الحالية غير صحيحة' },
      });
    }

    const hash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password_hash: hash },
    });

    return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
  }

  // 4. قائمة الأجهزة المسجلة
  async getDevices(userId: string) {
    const devices = await this.prisma.userDevice.findMany({
      where: { userId },
      select: {
        id: true,
        device_name: true,
        deviceModel: true,
        deviceOs: true,
        deviceType: true,
        isPrimary: true,
        isActive: true,
        lastLoginAt: true,
      },
      orderBy: { lastLoginAt: 'desc' },
    });

    return { success: true, data: devices };
  }

  // 5. إلغاء تفعيل جهاز
  async deactivateDevice(userId: string, deviceId: string) {
    const device = await this.prisma.userDevice.findFirst({
      where: { id: deviceId, userId },
    });

    if (!device) {
      throw new NotFoundException({
        success: false,
        error: { code: 'DEVICE_NOT_FOUND', message: 'الجهاز غير موجود' },
      });
    }

    if (device.isPrimary) {
      const activeCount = await this.prisma.userDevice.count({
        where: { userId, isActive: true },
      });
      if (activeCount === 1) {
        throw new BadRequestException({
          success: false,
          error: { code: 'CANNOT_DEACTIVATE_LAST', message: 'لا يمكن إلغاء جهازك الوحيد النشط' },
        });
      }
    }

    await this.prisma.userDevice.update({
      where: { id: deviceId },
      data: { isActive: false, isPrimary: false },
    });

    return { success: true, message: 'تم إلغاء تفعيل الجهاز' };
  }
}
