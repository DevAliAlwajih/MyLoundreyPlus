import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateSubscriptionDto {
  @IsUUID()
  laundryId: string;

  @IsUUID()
  planId: string;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
