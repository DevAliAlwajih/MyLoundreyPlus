import { IsUUID, IsDateString, IsString, IsOptional, Matches } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  laundryId: string;

  @IsDateString()
  bookingDate: string; // "2025-06-15"

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'الوقت يجب أن يكون بصيغة HH:MM',
  })
  bookingTime: string; // "10:30"

  @IsString()
  @IsOptional()
  notes?: string;
}
