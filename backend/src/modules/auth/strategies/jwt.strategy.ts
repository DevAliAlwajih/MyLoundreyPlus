import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        uniqueId: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'المستخدم غير موجود أو غير نشط' },
      });
    }

    // 🔑 إذا كان المستخدم صاحب مغسلة — أضف laundryId للـ request
    let laundryId: string | null = null;
    if (user.role === 'laundry') {
      const laundry = await this.prisma.laundry.findFirst({
        where: { ownerId: user.id },
        select: { id: true },
      });
      laundryId = laundry?.id ?? null;
    }

    return { ...user, laundryId };
  }
}

