import { Controller, Post, Get, Patch, Body, Req, Ip, UseGuards, Res, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
import { ConfirmEmailChangeDto } from './dto/confirm-email-change.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── تسجيل بإيميل + كلمة مرور ───
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ─── تسجيل دخول بإيميل + كلمة مرور ───
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: any, @Ip() ip: string) {
    const deviceInfo = {
      ipAddress: ip,
      userAgent: req.headers['user-agent'],
    };
    return this.authService.login(dto.email, dto.password, deviceInfo);
  }

  // ─── TEMP DEBUG ENDPOINT ───
  @Get('debug/:email')
  async debugUser(@Param('email') email: string) {
    return this.authService.debugUser(email);
  }

  // ─── OTP: إرسال رمز التحقق على الإيميل ───
  @Post('otp/send')
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOTP(dto.email);
  }

  // ─── OTP: التحقق من الرمز ───
  @Post('otp/verify')
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: any, @Ip() ip: string) {
    const deviceInfo = {
      ...dto.deviceInfo,
      ipAddress: ip,
      userAgent: req.headers['user-agent'],
    };
    return this.authService.verifyOTP(dto.email, dto.otp, deviceInfo);
  }

  // ─── استعادة كلمة المرور ───
  @Post('password/reset')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }

  // ─── تجديد الـ Access Token ───
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  // ─── تحديث بيانات المستخدم (الاسم فقط) ───
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@Req() req: any, @Body() dto: UpdateMeDto) {
    return this.authService.updateMe(req.user.id, dto);
  }

  // ─── طلب تغيير الإيميل ───
  @Post('me/email/request')
  @UseGuards(JwtAuthGuard)
  async requestEmailChange(@Req() req: any, @Body() dto: RequestEmailChangeDto) {
    return this.authService.requestEmailChange(req.user.id, dto.newEmail);
  }

  // ─── تأكيد تغيير الإيميل ───
  @Post('me/email/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmEmailChange(@Req() req: any, @Body() dto: ConfirmEmailChangeDto) {
    return this.authService.confirmEmailChange(req.user.id, dto.newEmail, dto.otp);
  }

  // ─── أدمن: تسجيل دخول ───
  @Post('admin/login')
  async adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto.email, dto.password);
  }

  // ─── Google OAuth: بدء التسجيل ───
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Passport يعيد التوجيه تلقائياً لـ Google
  }

  // ─── Google OAuth: Callback ───
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const tokens = await this.authService.handleGoogleLogin(req.user);

    // للتطبيقات المحمولة — أرسل الـ token في الـ URL أو كـ JSON
    const frontendUrl = process.env.FRONTEND_APP_URL ?? 'http://localhost:8081';
    const { accessToken, refreshToken, user } = tokens as any;

    // Redirect مع الـ tokens (التطبيق يعالجها)
    res.redirect(
      `${frontendUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}&userId=${user.id}`,
    );
  }
}
