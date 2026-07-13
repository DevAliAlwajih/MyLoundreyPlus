import { IsOptional, IsString, MaxLength, Matches, IsIn } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+9(6[5678]|7[1248])\d{7,9}$/, {
    message: 'رقم الهاتف يجب أن يكون خليجياً أو يمنياً',
  })
  phoneNumber?: string;

  @IsIn(['SA', 'AE', 'KW', 'BH', 'QA', 'OM', 'YE'])
  @IsOptional()
  country?: string;

  @IsIn(['SAR', 'AED', 'KWD', 'BHD', 'QAR', 'OMR', 'YER'])
  @IsOptional()
  currency?: string;
}
