import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'الإيميل مطلوب' })
  @IsEmail({}, { message: 'الإيميل غير صالح' })
  email: string;

  @IsNotEmpty({ message: 'رمز التحقق مطلوب' })
  @IsString()
  @Length(6, 6, { message: 'رمز التحقق يجب أن يكون 6 أرقام بالضبط' })
  otp: string;

  @IsNotEmpty({ message: 'كلمة المرور الجديدة مطلوبة' })
  @IsString()
  @MinLength(6, { message: 'كلمة المرور يجب أن لا تقل عن 6 أحرف' })
  newPassword: string;
}
