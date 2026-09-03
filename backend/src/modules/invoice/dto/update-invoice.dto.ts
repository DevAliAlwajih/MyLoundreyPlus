import {
  IsOptional,
  IsString,
  IsIn,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceItemLineDto } from './create-invoice.dto';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemLineDto)
  items?: InvoiceItemLineDto[];

  @IsOptional()
  @IsIn(['cash', 'card', 'deferred'])
  paymentType?: 'cash' | 'card' | 'deferred';

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  paidAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  editReason?: string;

  @IsOptional()
  @Type(() => Date)
  expectedDeliveryAt?: Date;

  @IsOptional()
  @IsString()
  walkInLocation?: string;

  @IsOptional()
  @Type(() => Date)
  createdAt?: Date;
}
