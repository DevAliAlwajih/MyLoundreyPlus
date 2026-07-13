import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'الاسم الكامل مطلوب' })
  fullName: string;

  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'اسم المغسلة مطلوب' })
  laundryName: string;

  @IsString()
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'رمز الدولة مطلوب' })
  countryCode: string;

  @IsString()
  @IsOptional()
  role?: string;
}

