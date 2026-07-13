import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { UploadService } from '../../upload/upload.service';
import { SendMessageDto } from './dto/send-message.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly uploadService: UploadService,
  ) {}

  // ────────────────────────────────────────────────────
  // 0. رفع المرفقات للدردشة
  // ────────────────────────────────────────────────────
  @Post('upload')
  @UseInterceptors(FileInterceptor('attachment', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|pdf)$/)) {
        cb(new BadRequestException('نوع الملف غير مدعوم — يُسمح فقط بـ الصور وملفات PDF'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  async uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('لم يتم إرسال أي ملف');
    const url = await this.uploadService.saveImage(file, 'chat-attachments');
    return { success: true, data: { url, type: file.mimetype.includes('pdf') ? 'pdf' : 'image' } };
  }

  // ────────────────────────────────────────────────────
  // 1. الدعم الفني (متاح للجميع: مغسلة أو عميل)
  // ────────────────────────────────────────────────────

  @Get('support/messages')
  getSupportMessages(@Req() req: any, @Query() query: QueryMessagesDto) {
    return this.chatService.getSupportMessages(req.user.id, req.user.role, query);
  }

  @Post('support/messages')
  sendMessageToSupport(@Req() req: any, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessageToSupport(req.user.id, req.user.role, dto);
  }

  // ────────────────────────────────────────────────────
  // 2. المغسلة ↔ العميل (من جهة المغسلة)
  // ────────────────────────────────────────────────────

  private getLaundryId(req: any): string {
    const laundryId = req.user.laundryId;
    if (!laundryId) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'NO_LAUNDRY', message: 'حسابك غير مرتبط بمغسلة' },
      });
    }
    return laundryId;
  }

  @UseGuards(RolesGuard)
  @Roles('laundry')
  @Get('laundry/:customerId/messages')
  getLaundryMessages(
    @Req() req: any,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query() query: QueryMessagesDto,
  ) {
    return this.chatService.getLaundryMessages(this.getLaundryId(req), customerId, query);
  }

  @UseGuards(RolesGuard)
  @Roles('laundry')
  @Post('laundry/:customerId/messages')
  sendMessageToCustomer(
    @Req() req: any,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessageToCustomer(this.getLaundryId(req), customerId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('laundry')
  @Patch('laundry/:customerId/read')
  markAsReadByLaundry(
    @Req() req: any,
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.chatService.markAsReadByLaundry(this.getLaundryId(req), customerId);
  }

  // ────────────────────────────────────────────────────
  // 3. العميل ↔ المغسلة (من جهة العميل)
  // ────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles('customer')
  @Get(':laundryId/messages')
  getCustomerMessages(
    @Req() req: any,
    @Param('laundryId', ParseUUIDPipe) laundryId: string,
    @Query() query: QueryMessagesDto,
  ) {
    return this.chatService.getCustomerMessages(req.user.id, laundryId, query);
  }

  @UseGuards(RolesGuard)
  @Roles('customer')
  @Post(':laundryId/messages')
  sendMessageToLaundry(
    @Req() req: any,
    @Param('laundryId', ParseUUIDPipe) laundryId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessageToLaundry(req.user.id, laundryId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('customer')
  @Patch(':laundryId/read')
  markAsRead(
    @Req() req: any,
    @Param('laundryId', ParseUUIDPipe) laundryId: string,
  ) {
    return this.chatService.markAsRead(req.user.id, laundryId);
  }
}
