import { IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMessagesDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @IsDateString()
  before?: string; // جلب رسائل قبل تاريخ معين (infinite scroll)
}
