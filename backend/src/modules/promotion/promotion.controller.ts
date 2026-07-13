import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PromotionService } from './promotion.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { QueryPromotionDto } from './dto/query-promotion.dto';
import { UploadService } from '../../upload/upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Promotions')
@Controller('promotions')
export class PromotionController {
  constructor(
    private readonly promotionService: PromotionService,
    private readonly uploadService: UploadService,
  ) {}

  // ────────────────────────────────────────────────────
  // 🔐 مسارات المغسلة (Laundry)
  // يجب أن تُعرّف قبل مسارات المتغيرات العامة لتجنب تداخل الـ Route
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('laundry')
  @ApiOperation({ summary: 'Laundry: Upload promotion image' })
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          cb(
            new BadRequestException('نوع الملف غير مدعوم — يُسمح فقط بالصور (jpg, jpeg, png, webp)'),
            false,
          );
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('لم يتم إرسال أي صورة');
    const url = await this.uploadService.saveImage(file, 'promotions');
    return { success: true, data: { url } };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('laundry')
  @ApiOperation({ summary: 'Laundry: Get my promotions' })
  @Get('my')
  getMyPromotions(@Req() req: any, @Query() query: QueryPromotionDto) {
    return this.promotionService.getMyPromotions(this.getLaundryId(req), query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('laundry')
  @ApiOperation({ summary: 'Laundry: Create a new promotion' })
  @Post()
  createPromotion(@Req() req: any, @Body() dto: CreatePromotionDto) {
    return this.promotionService.createPromotion(this.getLaundryId(req), dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('laundry')
  @ApiOperation({ summary: 'Laundry: Toggle promotion active status' })
  @Patch(':id/toggle')
  togglePromotion(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.promotionService.togglePromotion(this.getLaundryId(req), id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('laundry')
  @ApiOperation({ summary: 'Laundry: Update a promotion' })
  @Patch(':id')
  updatePromotion(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.promotionService.updatePromotion(this.getLaundryId(req), id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('laundry')
  @ApiOperation({ summary: 'Laundry: Delete a promotion' })
  @Delete(':id')
  deletePromotion(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.promotionService.deletePromotion(this.getLaundryId(req), id);
  }

  // ────────────────────────────────────────────────────
  // 🌍 مسارات عامة والتطبيقات (Public/Apps)
  // ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Public: Get active promotions for a specific laundry' })
  @Get('laundry/:laundryId')
  getLaundryPromotions(@Param('laundryId', ParseUUIDPipe) laundryId: string) {
    return this.promotionService.getLaundryPromotions(laundryId);
  }

  @ApiOperation({ summary: 'Public: Get specific promotion details' })
  @Get(':id')
  getPromotionDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionService.getPromotionDetails(id);
  }

  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Public: Record a view for a promotion' })
  @Post(':id/view')
  recordView(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user?.id;
    return this.promotionService.recordView(id, userId);
  }
}
