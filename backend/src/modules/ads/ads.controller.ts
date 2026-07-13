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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { QueryAdDto } from './dto/query-ad.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Ads')
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  // ────────────────────────────────────────────────────
  // 🛡️ مسارات مدير النظام (Admin)
  // يجب أن تُعرّف قبل مسارات المتغيرات مثل /:id
  // ────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin: Get all ads (active and inactive) with statistics' })
  @Get('admin/all')
  getAllAdsForAdmin(@Query() query: QueryAdDto) {
    return this.adsService.getAllAdsForAdmin(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin: Create a new ad' })
  @Post()
  createAd(@Req() req: any, @Body() dto: CreateAdDto) {
    return this.adsService.createAd(req.user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin: Toggle ad active status' })
  @Patch(':id/toggle')
  toggleAd(@Param('id', ParseUUIDPipe) id: string) {
    return this.adsService.toggleAd(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin: Update an ad' })
  @Patch(':id')
  updateAd(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAdDto) {
    return this.adsService.updateAd(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin: Delete an ad' })
  @Delete(':id')
  deleteAd(@Param('id', ParseUUIDPipe) id: string) {
    return this.adsService.deleteAd(id);
  }

  // ────────────────────────────────────────────────────
  // 🌍 مسارات عامة والتطبيقات (Public/Apps)
  // ────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Public: Get active ads tailored to user audience' })
  @Get()
  getActiveAds(@Req() req: any, @Query() query: QueryAdDto) {
    // req.user قد يكون موجوداً إذا استخدم المستخدم توكن
    const role = req.user?.role;
    return this.adsService.getActiveAds(role, query.audience);
  }

  @ApiOperation({ summary: 'Public: Get specific ad details' })
  @Get(':id')
  getAdDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.adsService.getAdDetails(id);
  }

  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Public: Record a view for an ad' })
  @Post(':id/view')
  recordView(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user?.id; // يسجل المشاهدة فقط إذا كان للمستخدم ID
    return this.adsService.recordView(id, userId);
  }
}
