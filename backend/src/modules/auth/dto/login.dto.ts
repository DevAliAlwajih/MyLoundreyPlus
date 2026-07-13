import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'الإيميل مطلوب' })
  @IsEmail({}, { message: 'الإيميل غير صالح' })
  email: string;

  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @IsString()
  @MinLength(6)
  password: string;

  // Device fields — optional, used for device tracking
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() deviceId?: string;
  @IsOptional() @IsString() deviceModel?: string;
  @IsOptional() @IsString() os?: string;
  @IsOptional() @IsString() osVersion?: string;
  @IsOptional() @IsString() fcmToken?: string;
}
