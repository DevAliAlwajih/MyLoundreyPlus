import { IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryBookingDto {
  @IsOptional()
  @IsIn(['pending', 'confirmed', 'rejected', 'cancelled', 'completed'])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
