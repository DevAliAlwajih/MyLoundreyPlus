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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from './dto/promo-code.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Subscriptions & Commissions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // ────────────────────────────────────────────────────
  // 🌍 1. مسارات عامة (Public)
  // ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get active subscription & recharge plans' })
  @Get('plans')
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  @ApiOperation({ summary: 'Get plan details by ID' })
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

  // --- Plans & Packages Admin CRUD ---
  @ApiOperation({ summary: 'Admin: Get all plans (active & inactive)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/all-plans')
  adminGetAllPlans() {
    return this.subscriptionService.adminGetAllPlans();
  }

  @ApiOperation({ summary: 'Admin: Create new plan / package' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/plans')
  adminCreatePlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionService.adminCreatePlan(dto);
  }

  @ApiOperation({ summary: 'Admin: Update plan / package' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/plans/:id')
  adminUpdatePlan(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePlanDto) {
    return this.subscriptionService.adminUpdatePlan(id, dto);
  }

  @ApiOperation({ summary: 'Admin: Delete / Deactivate plan' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/plans/:id')
  adminDeletePlan(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionService.adminDeletePlan(id);
  }

  // --- Promo Codes Admin CRUD ---
  @ApiOperation({ summary: 'Admin: Get all promo codes' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/promo-codes')
  adminGetAllPromoCodes() {
    return this.subscriptionService.adminGetAllPromoCodes();
  }

  @ApiOperation({ summary: 'Admin: Create promo code' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/promo-codes')
  adminCreatePromoCode(@Req() req: any, @Body() dto: CreatePromoCodeDto) {
    return this.subscriptionService.adminCreatePromoCode(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Admin: Update promo code' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/promo-codes/:id')
  adminUpdatePromoCode(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePromoCodeDto) {
    return this.subscriptionService.adminUpdatePromoCode(id, dto);
  }

  @ApiOperation({ summary: 'Admin: Delete promo code' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/promo-codes/:id')
  adminDeletePromoCode(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionService.adminDeletePromoCode(id);
  }

  // --- Commission Settings & Transactions ---
  @ApiOperation({ summary: 'Admin: Get commission & system billing settings' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/commissions/settings')
  getCommissionSettings() {
    return this.subscriptionService.getCommissionSettings();
  }

  @ApiOperation({ summary: 'Admin: Update commission & system billing settings' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/commissions/settings')
  updateCommissionSettings(
    @Req() req: any,
    @Body() data: { defaultCommissionRate?: number; defaultTrialDays?: number; defaultInitialBalance?: number; defaultDebtLimit?: number; minRechargeAmount?: number },
  ) {
    return this.subscriptionService.updateCommissionSettings(req.user.id, data);
  }

  @ApiOperation({ summary: 'Admin: Get all commission transactions' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/commissions/transactions')
  getCommissionTransactions(@Query() query: { laundryId?: string; limit?: number; offset?: number }) {
    return this.subscriptionService.getCommissionTransactions(query);
  }

  // --- Legacy Subscriptions endpoints ---
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
