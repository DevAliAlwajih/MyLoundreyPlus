import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ example: 'الباقة التجريبية 30 يوم' })
  @IsString()
  nameAr: string;

  @ApiProperty({ example: 'Trial Package 30 Days' })
  @IsString()
  nameEn: string;

  @ApiProperty({ example: 30, description: 'Duration in days' })
  @IsNumber()
  @Min(0)
  durationDays: number;

  @ApiProperty({ example: 0, description: 'Price in SAR' })
  @IsNumber()
  @Min(0)
  priceSar: number;

  @ApiPropertyOptional({ example: ['بدون عمولة خلال الفترة', 'دعم فني 24/7'] })
  @IsOptional()
  features?: any;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isSeasonal?: boolean;

  @ApiPropertyOptional({ example: 'عرض رمضان' })
  @IsOptional()
  @IsString()
  occasionName?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @ApiPropertyOptional({ example: '2025-03-01' })
  @IsOptional()
  @IsDateString()
  offerValidFrom?: string;

  @ApiPropertyOptional({ example: '2025-04-01' })
  @IsOptional()
  @IsDateString()
  offerValidUntil?: string;
}

export class UpdatePlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceSar?: number;

  @ApiPropertyOptional()
  @IsOptional()
  features?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSeasonal?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occasionName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  offerValidFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  offerValidUntil?: string;
}
