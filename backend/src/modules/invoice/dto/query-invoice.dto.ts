import { IsOptional, IsIn, IsUUID, IsNumber, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { INVOICE_STATUSES, InvoiceStatusType } from './update-invoice-status.dto';

export class QueryInvoiceDto {
  @IsOptional()
  @IsIn(INVOICE_STATUSES)
  status?: InvoiceStatusType;

  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  @IsOptional()
  @IsString()
  search?: string;

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
