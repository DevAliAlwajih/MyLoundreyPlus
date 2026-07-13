import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsInt, MaxLength, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'اسم القسم مطلوب' })
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number = 0;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
