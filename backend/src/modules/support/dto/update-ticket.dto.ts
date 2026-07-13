import { IsIn, IsString, IsNotEmpty } from 'class-validator';

export class UpdateTicketStatusDto {
  @IsIn(['open', 'in_progress', 'resolved', 'closed'])
  status: string;
}

export class ReplyTicketDto {
  @IsString()
  @IsNotEmpty()
  reply: string;
}
