import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHolidayDto {
  @ApiProperty({ example: '2026-07-09', description: 'Holiday date in YYYY-MM-DD format' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({ example: 'National Day', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
