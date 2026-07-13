import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'refreshToken مطلوب' })
  @IsString()
  refreshToken: string;
}
