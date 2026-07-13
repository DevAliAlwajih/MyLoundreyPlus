import { IsIn, IsString, IsOptional } from 'class-validator';

export class UpdateBookingStatusDto {
  @IsIn(['confirmed', 'rejected'])
  status: string;

  @IsString()
  @IsOptional()
  note?: string;
}
