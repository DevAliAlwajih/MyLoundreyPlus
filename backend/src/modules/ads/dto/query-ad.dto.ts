import { IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AdTarget } from './create-ad.dto';

export class QueryAdDto {
  @IsEnum(AdTarget)
  @IsOptional()
  audience?: AdTarget;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
