import {
  IsOptional,
  IsString,
  IsIn,
  IsNumber,
  IsInt,
  IsArray,
  IsUUID,
  IsDateString,
  ValidateNested,
  Min,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemLineDto {
  @IsNotEmpty()
  @IsUUID('4', { message: 'itemId يجب أن يكون UUID صالح' })
  itemId: string;

  @IsInt({ message: 'الكمية يجب أن تكون عدد صحيح' })
  @Min(1, { message: 'الكمية يجب أن تكون 1 على الأقل' })
  quantity: number;

  /** السعر المُرسل من الموبايل — إذا عدّله المستخدم يدوياً يُستخدم مباشرة */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice?: number;

  /** نوع الخدمة: غسيل فقط / كوي فقط / غسيل وكوي */
  @IsOptional()
  @IsIn(['washing_only', 'ironing_only', 'washing_and_ironing'], {
    message: "serviceType يجب أن يكون: 'washing_only' | 'ironing_only' | 'washing_and_ironing'",
  })
  serviceType?: 'washing_only' | 'ironing_only' | 'washing_and_ironing';

  /** نوع المعالجة: عادي / عاجل */
  @IsOptional()
  @IsIn(['normal', 'urgent'], {
    message: "processingType يجب أن يكون: 'normal' | 'urgent'",
  })
  processingType?: 'normal' | 'urgent';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInvoiceDto {
  // ─── العميل المسجّل ───
  @IsOptional()
  @IsString()
  customerUniqueId?: string;

  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  // ─── Walk-in Customer (بدون حساب) ───
  @IsOptional()
  @IsString()
  walkInName?: string;

  @IsOptional()
  @IsString()
  walkInPhone?: string;

  @IsOptional()
  @IsString()
  walkInLocation?: string;

  // ─── تفاصيل الفاتورة ───
  @IsIn(['cash', 'card', 'deferred', 'electronic'], {
    message: "paymentType يجب أن يكون: 'cash' | 'card' | 'deferred' | 'electronic'",
  })
  paymentType: 'cash' | 'card' | 'deferred' | 'electronic';

  @IsArray({ message: 'items يجب أن تكون مصفوفة' })
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemLineDto)
  items: InvoiceItemLineDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  discountPercent?: number;

  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  /** موعد التسليم المتوقع */
  @IsOptional()
  @Type(() => Date)
  expectedDeliveryAt?: Date;

  @IsOptional()
  @IsIn(['draft', 'received'], { message: "status يجب أن يكون 'draft' أو 'received'" })
  status?: 'draft' | 'received';
}
