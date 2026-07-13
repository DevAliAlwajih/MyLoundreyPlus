import { IsUUID, IsInt, Min, Max, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateRatingDto {
  @IsUUID()
  invoiceId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  stars: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  comment?: string;
}
