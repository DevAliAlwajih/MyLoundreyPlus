import { IsNotEmpty, IsString, Length, IsOptional, IsObject } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'رمز التحقق يجب أن يكون 6 أرقام' })
  otp: string;

  @IsOptional()
  @IsObject()
  deviceInfo?: {
    deviceId?: string;
    deviceType?: string;
    deviceOs?: string;
    deviceModel?: string;
    fcmToken?: string;
  };
}
