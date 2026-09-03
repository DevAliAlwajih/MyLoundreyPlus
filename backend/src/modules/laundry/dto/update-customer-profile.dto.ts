import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCustomerProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  localName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  localPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
