import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpdateEmailDto {
  @IsEmail({}, { message: 'صيغة البريد الإلكتروني غير صحيحة' })
  @IsNotEmpty({ message: 'البريد الإلكتروني الجديد مطلوب' })
  newEmail: string;

  @IsString({ message: 'كلمة المرور الحالية يجب أن تكون نصاً' })
  @IsNotEmpty({ message: 'كلمة المرور الحالية مطلوبة للتأكيد' })
  currentPassword: string;
}
