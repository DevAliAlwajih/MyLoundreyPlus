import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendOtpDto {
  @IsNotEmpty({ message: 'الإيميل مطلوب' })
  @IsEmail({}, { message: 'الإيميل غير صالح' })
  email: string;
}
