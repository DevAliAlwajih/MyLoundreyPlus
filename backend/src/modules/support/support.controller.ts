import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketDto } from './dto/query-ticket.dto';
import { UpdateTicketStatusDto, ReplyTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('support/tickets')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ────────────────────────────────────────────────────
  // 👥 للعميل والمغسلة
  // ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Customer/Laundry: Open a new ticket' })
  @Post()
  createTicket(@Req() req: any, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(req.user.id, req.user.role, dto);
  }

  @ApiOperation({ summary: 'Customer/Laundry: Get my tickets' })
  @Get('my')
  getMyTickets(@Req() req: any, @Query() dto: QueryTicketDto) {
    return this.supportService.getMyTickets(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Customer/Laundry: Get my ticket details' })
  @Get('my/:id')
  getMyTicketDetails(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.supportService.getMyTicketDetails(req.user.id, id);
  }

  // ────────────────────────────────────────────────────
  // 👑 للأدمن فقط
  // ────────────────────────────────────────────────────

  @Roles('admin')
  @ApiOperation({ summary: 'Admin: Get all tickets' })
  @Get()
  getAllTickets(@Query() dto: QueryTicketDto) {
    return this.supportService.getAllTickets(dto);
  }

  @Roles('admin')
  @ApiOperation({ summary: 'Admin: Get ticket details' })
  @Get(':id')
  getTicketDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.supportService.getTicketDetails(id);
  }

  @Roles('admin')
  @ApiOperation({ summary: 'Admin: Reply to a ticket' })
  @Patch(':id/reply')
  replyToTicket(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplyTicketDto,
  ) {
    return this.supportService.replyToTicket(req.user.id, id, dto.reply);
  }

  @Roles('admin')
  @ApiOperation({ summary: 'Admin: Update ticket status' })
  @Patch(':id/status')
  updateTicketStatus(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.supportService.updateTicketStatus(req.user.id, id, dto);
  }
}
