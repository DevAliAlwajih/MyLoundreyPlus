import { IsIn, IsOptional, IsString } from 'class-validator';

export const INVOICE_STATUSES = [
  'draft',
  'received',
  'washing',
  'ironing',
  'ready',
  'completed',
  'cancelled',
] as const;

export type InvoiceStatusType = (typeof INVOICE_STATUSES)[number];

export class UpdateInvoiceStatusDto {
  @IsIn(INVOICE_STATUSES, {
    message: `status يجب أن يكون أحد: ${INVOICE_STATUSES.join(' | ')}`,
  })
  status: InvoiceStatusType;

  @IsOptional()
  @IsString()
  note?: string;
}
