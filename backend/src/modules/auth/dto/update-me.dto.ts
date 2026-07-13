import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMeDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;
}
