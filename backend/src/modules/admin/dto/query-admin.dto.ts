import { IsOptional, IsIn, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAdminLaundriesDto {
  @IsOptional()
  @IsIn(['pending', 'trial', 'active', 'suspended', 'banned'])
  status?: string;

  @IsOptional()
  @IsString()
  search?: string; // بحث بالاسم

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class QueryAdminUsersDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
