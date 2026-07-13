import { IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTicketDto {
  @IsOptional()
  @IsIn(['open', 'in_progress', 'resolved', 'closed'])
  status?: string;

  @IsOptional()
  @IsIn(['customer', 'laundry'])
  userType?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
