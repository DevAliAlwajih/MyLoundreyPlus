import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, Min } from 'class-validator';

export class RechargeBalanceDto {
  @IsNotEmpty({ message: 'المبلغ مطلوب' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'المبلغ يجب أن يكون رقماً صالحاً' })
  @Min(0.01, { message: 'المبلغ يجب أن يكون أكبر من 0' })
  amount: number;

  @IsOptional()
  @IsEnum(['cash', 'bank_transfer', 'cheque', 'electronic', 'other'], {
    message: 'طريقة الدفع غير صالحة',
  })
  payment_method?: 'cash' | 'bank_transfer' | 'cheque' | 'electronic' | 'other';

  @IsOptional()
  @IsString()
  reference_number?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
