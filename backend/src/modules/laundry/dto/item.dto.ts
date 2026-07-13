import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  IsNumber,
  MaxLength,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemDto {
  @IsNotEmpty({ message: 'معرّف القسم مطلوب' })
  @IsUUID('4', { message: 'categoryId يجب أن يكون UUID صالح' })
  categoryId: string;

  @IsNotEmpty({ message: 'الاسم العربي مطلوب' })
  @IsString()
  @MaxLength(150)
  nameAr: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameEn?: string;

  @IsNotEmpty({ message: 'السعر الأساسي مطلوب' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  washing_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  ironing_price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number = 0;
}


export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameEn?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  washing_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  ironing_price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePriceDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
