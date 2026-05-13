import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @IsString()
  @Matches(/^\+9[67]\d{8,9}$/, {
    message: 'رقم الهاتف غير صالح. يجب أن يبدأ بـ +966 أو +967 (مثال: +966500000000)',
  })
  phoneNumber: string;
}
