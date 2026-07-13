import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class ConfirmEmailChangeDto {
  @IsNotEmpty()
  @IsEmail()
  newEmail: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp: string;
}
