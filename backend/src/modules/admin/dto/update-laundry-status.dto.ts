import { IsIn, IsString, IsOptional } from 'class-validator';

export class UpdateLaundryStatusDto {
  @IsIn(['pending', 'trial', 'active', 'suspended', 'banned'])
  status: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
