import { IsEmail, IsNotEmpty, IsString, Length, IsOptional, IsObject } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty({ message: 'الإيميل مطلوب' })
  @IsEmail({}, { message: 'الإيميل غير صالح' })
  email: string;

  @IsNotEmpty({ message: 'رمز التحقق مطلوب' })
  @IsString()
  @Length(6, 6, { message: 'رمز التحقق يجب أن يكون 6 أرقام بالضبط' })
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
