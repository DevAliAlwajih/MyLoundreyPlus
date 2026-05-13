import { Controller, Post, Body, Req, Ip, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/send')
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOTP(dto.phoneNumber);
  }

  @Post('otp/verify')
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: any, @Ip() ip: string) {
    const deviceInfo = {
      ...dto.deviceInfo,
      ipAddress: ip,
      userAgent: req.headers['user-agent'],
    };
    return this.authService.verifyOTP(dto.phoneNumber, dto.otp, deviceInfo);
  }
}
