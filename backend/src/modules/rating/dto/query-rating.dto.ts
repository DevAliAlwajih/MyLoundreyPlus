import { IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryRatingDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  stars?: number;
}
