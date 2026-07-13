import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { QueryRatingDto } from './dto/query-rating.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Ratings')
@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  // ────────────────────────────────────────────────────
  // 🔐 مسارات العميل (Customer)
  // ────────────────────────────────────────────────────

  /** POST /api/v1/ratings — إنشاء تقييم */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  @Post()
  createRating(@Req() req: any, @Body() dto: CreateRatingDto) {
    return this.ratingService.createRating(req.user.id, dto);
  }

  /** GET /api/v1/ratings/my — تقييماتي السابقة */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  @Get('my')
  getMyRatings(@Req() req: any) {
    return this.ratingService.getMyRatings(req.user.id);
  }

  /** GET /api/v1/ratings/can-rate/:invoiceId — هل يمكنني تقييم هذه الفاتورة؟ */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  @Get('can-rate/:invoiceId')
  canRate(
    @Req() req: any,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ) {
    return this.ratingService.canRate(req.user.id, invoiceId);
  }

  // ────────────────────────────────────────────────────
  // 🌍 مسارات عامة (Public)
  // ────────────────────────────────────────────────────

  /** GET /api/v1/ratings/laundry/:laundryId — تقييمات مغسلة */
  @Get('laundry/:laundryId')
  getLaundryRatings(
    @Param('laundryId', ParseUUIDPipe) laundryId: string,
    @Query() query: QueryRatingDto,
  ) {
    return this.ratingService.getLaundryRatings(laundryId, query);
  }
}
