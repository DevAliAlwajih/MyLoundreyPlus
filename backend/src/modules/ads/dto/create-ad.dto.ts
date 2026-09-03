import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsOptional,
  IsUrl,
  IsEnum,
  IsInt,
  IsDateString,
  IsNumber,
} from 'class-validator';

export enum AdTarget {
  all = 'all',
  customers = 'customers',
  laundries = 'laundries',
}

export class CreateAdDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  mediaUrls: string[]; // روابط الصور أو الفيديوهات

  @IsString()
  @IsOptional()
  bodyText?: string;

  @IsUrl()
  @IsOptional()
  linkUrl?: string;

  @IsEnum(AdTarget)
  @IsOptional()
  targetAudience?: AdTarget = AdTarget.all;

  @IsNumber()
  @IsOptional()
  adFee?: number = 0;

  @IsInt()
  @IsOptional()
  sortOrder?: number = 0;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
