import { IsString, IsOptional, IsIn } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsIn(['image', 'pdf'])
  @IsOptional()
  attachmentType?: string;
}
