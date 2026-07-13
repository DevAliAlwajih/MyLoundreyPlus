import {
  IsOptional,
  IsNumber,
  IsString,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryLaundryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'lat يجب أن يكون رقماً' })
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'lng يجب أن يكون رقماً' })
  @Min(-180)
  @Max(180)
  lng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  radius?: number = 10;

  @IsOptional()
  @IsString()
  @IsIn(['distance', 'rating', 'price'], {
    message: "sort يجب أن يكون: 'distance' | 'rating' | 'price'",
  })
  sort?: 'distance' | 'rating' | 'price' = 'distance';

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
