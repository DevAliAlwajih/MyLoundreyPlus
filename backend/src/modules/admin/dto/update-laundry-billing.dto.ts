import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';

export class UpdateLaundryBillingDto {
  @IsOptional()
  @IsEnum(['subscription', 'commission'])
  billing_type?: 'subscription' | 'commission';

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  commission_rate?: number;  // نسبة العمولة بالـ%

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  debt_limit?: number;  // حد الآجل (أقصى دين مسموح به)

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  balance?: number;  // تعديل الرصيد مباشرة

  @IsOptional()
  @IsString()
  trial_commission_ends_at?: string; // ISO date string — نهاية الفترة التجريبية
}
