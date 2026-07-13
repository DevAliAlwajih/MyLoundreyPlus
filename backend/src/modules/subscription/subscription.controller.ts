import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // ────────────────────────────────────────────────────
  // 🌍 1. مسارات عامة (Public)
  // ────────────────────────────────────────────────────

  @Get('plans')
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Get('plans/:id')
  getPlanById(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionService.getPlanById(id);
  }

  // ────────────────────────────────────────────────────
  // 🔐 2. مسارات المغسلة (Laundry)
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
  @Get('my')
  getMySubscription(@Req() req: any) {
    return this.subscriptionService.getMySubscription(this.getLaundryId(req));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('laundry')
  @Get('my/history')
  getMySubscriptionHistory(@Req() req: any) {
    return this.subscriptionService.getMySubscriptionHistory(this.getLaundryId(req));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('laundry')
  @Post('validate-promo')
  validatePromoCode(@Body('code') code: string, @Body('planId', ParseUUIDPipe) planId: string) {
    return this.subscriptionService.validatePromoCode(code, planId);
  }

  // ────────────────────────────────────────────────────
  // 🛡️ 3. مسارات مدير النظام (Admin)
  // ────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('expiring')
  getExpiring() {
    return this.subscriptionService.getExpiring();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  getAllSubscriptions() {
    return this.subscriptionService.getAllSubscriptions();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  createSubscription(@Req() req: any, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.createSubscription(req.user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/renew')
  renewSubscription(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionService.renewSubscription(id, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/deactivate')
  deactivateSubscription(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionService.deactivateSubscription(id);
  }
}
