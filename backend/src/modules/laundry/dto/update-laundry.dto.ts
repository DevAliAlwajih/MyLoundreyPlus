import {
  IsOptional,
  IsString,
  IsObject,
  IsBoolean,
  IsNumber,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';


class WorkingHoursDayDto {
  @IsString()
  open: string;

  @IsString()
  close: string;

  @IsOptional()
  closed?: boolean;
}

export class UpdateLaundryDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsObject()
  workingHours?: Record<
    string,
    { open: string; close: string; closed?: boolean }
  >;

  @IsOptional()
  logoUrl?: string | null;

  // ─── إعدادات الضريبة ───
  @IsOptional()
  @IsBoolean()
  tax_enabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  tax_rate?: number;

  // ─── إعدادات الاستعجال ───
  @IsOptional()
  @IsBoolean()
  urgency_enabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  urgency_fee?: number;
}
