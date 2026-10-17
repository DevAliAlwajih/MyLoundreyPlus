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
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { NotificationService } from '../notification/notification.service';
import { QueryAdminLaundriesDto, QueryAdminUsersDto } from './dto/query-admin.dto';
import { UpdateLaundryStatusDto } from './dto/update-laundry-status.dto';
import { UpdateLaundryBillingDto } from './dto/update-laundry-billing.dto';
import { RechargeBalanceDto } from './dto/recharge-balance.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpdateLaundryDto } from '../laundry/dto/update-laundry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly notificationService: NotificationService,
  ) {}

  // ────────────────────────────────────────────────────
  // 📊 Analytics
  // ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Admin: Get overview analytics' })
  @Get('analytics/overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @ApiOperation({ summary: 'Admin: Get dashboard stats with currency filter' })
  @Get('dashboard-stats')
  getDashboardStats(@Query('currency') currency?: string) {
    return this.adminService.getDashboardStats(currency);
  }

  @ApiOperation({ summary: 'Admin: Get admin notifications list' })
  @Get('notifications')
  getAdminNotifications(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationService.getAdminNotifications(
      req.user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      unreadOnly === 'true',
    );
  }

  @ApiOperation({ summary: 'Admin: Mark all admin notifications as read' })
  @Patch('notifications/read-all')
  markAdminNotificationsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @ApiOperation({ summary: 'Admin: Mark single notification as read' })
  @Patch('notifications/:id/read')
  markAdminNotificationRead(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationService.markAsRead(req.user.id, id);
  }

  @ApiOperation({ summary: 'Admin: Get revenue analytics' })
  @Get('analytics/revenue')
  getRevenueAnalytics() {
    return this.adminService.getRevenueAnalytics();
  }

  @ApiOperation({ summary: 'Admin: Get top laundries' })
  @Get('analytics/laundries')
  getTopLaundries() {
    return this.adminService.getTopLaundries();
  }

  // ────────────────────────────────────────────────────
  // ⚙️ Settings
  // ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Admin: Get system settings' })
  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @ApiOperation({ summary: 'Admin: Update system setting' })
  @Patch('settings/:key')
  updateSetting(@Req() req: any, @Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.adminService.updateSetting(key, dto.value, req.user.id);
  }

  // ────────────────────────────────────────────────────
  // 🏢 Laundries
  // ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Admin: Get all laundries' })
  @Get('laundries')
  getLaundries(@Query() dto: QueryAdminLaundriesDto) {
    return this.adminService.getLaundries(dto);
  }

  @ApiOperation({ summary: 'Admin: Get laundry details' })
  @Get('laundries/:id')
  getLaundryDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getLaundryDetails(id);
  }

  @ApiOperation({ summary: 'Admin: Update laundry details' })
  @Patch('laundries/:id')
  updateLaundryDetails(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLaundryDto,
  ) {
    return this.adminService.updateLaundryDetails(id, dto);
  }

  @ApiOperation({ summary: 'Admin: Override laundry currency manually' })
  @Patch('laundries/:id/currency')
  updateLaundryCurrency(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('currency') currency: string,
  ) {
    return this.adminService.updateLaundryCurrency(id, currency);
  }

  @ApiOperation({ summary: 'Admin: Update laundry owner account credentials' })
  @Patch('laundries/:id/owner-account')
  updateLaundryOwnerAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { email?: string; password?: string },
  ) {
    return this.adminService.updateLaundryOwnerAccount(id, dto);
  }

  @ApiOperation({ summary: 'Admin: Update laundry status' })
  @Patch('laundries/:id/status')
  updateLaundryStatus(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLaundryStatusDto,
  ) {
    return this.adminService.updateLaundryStatus(id, req.user.id, dto);
  }

  @ApiOperation({ summary: 'Admin: Update laundry billing settings (commission rate, debt limit, balance, trial period)' })
  @Patch('laundries/:id/billing')
  updateLaundryBilling(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLaundryBillingDto,
  ) {
    return this.adminService.updateLaundryBilling(id, dto);
  }

  @ApiOperation({ summary: 'Admin: Get laundry devices' })
  @Get('laundries/:id/devices')
  getLaundryDevices(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getLaundryDevices(id);
  }

  @ApiOperation({ summary: 'Admin: Toggle laundry device status' })
  @Patch('laundries/:id/devices/:deviceId')
  toggleLaundryDevice(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Body('isActive', ParseBoolPipe) isActive: boolean,
  ) {
    return this.adminService.toggleDeviceByLaundryId(id, deviceId, isActive);
  }

  @ApiOperation({ summary: 'Admin: Delete laundry and owner account' })
  @Delete('laundries/:id')
  deleteLaundry(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('password') password?: string,
  ) {
    return this.adminService.deleteLaundry(id, req.user.id, password);
  }

  // ────────────────────────────────────────────────────
  // 👥 Users
  // ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Admin: Get all users' })
  @Get('users')
  getUsers(@Query() dto: QueryAdminUsersDto) {
    return this.adminService.getUsers(dto);
  }

  @ApiOperation({ summary: 'Admin: Get user details' })
  @Get('users/:id')
  getUserDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserDetails(id);
  }

  @ApiOperation({ summary: 'Admin: Update user status' })
  @Patch('users/:id/status')
  updateUserStatus(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, req.user.id, dto);
  }

  @ApiOperation({ summary: 'Admin: Get user devices' })
  @Get('users/:id/devices')
  getUserDevices(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserDevices(id);
  }

  @ApiOperation({ summary: 'Admin: Toggle user device status' })
  @Patch('users/:id/devices/:deviceId')
  toggleUserDevice(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Body('isActive', ParseBoolPipe) isActive: boolean,
  ) {
    return this.adminService.toggleDevice(id, deviceId, isActive);
  }

  @ApiOperation({ summary: 'Admin: Delete user account' })
  @Delete('users/:id')
  deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteUser(id);
  }

  // ────────────────────────────────────────────────────
  // 👥 Customers (Alias routes)
  // ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Admin: Get all customers' })
  @Get('customers')
  getCustomers(@Query() dto: QueryAdminUsersDto) {
    return this.adminService.getUsers({ ...dto, role: 'customer' });
  }

  @ApiOperation({ summary: 'Admin: Update customer status' })
  @Patch('customers/:id/status')
  updateCustomerStatus(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
  ) {
    const isActive = dto.isActive !== undefined ? dto.isActive : dto.is_active;
    return this.adminService.updateUserStatus(id, req.user.id, { isActive, reason: dto.reason });
  }

  @ApiOperation({ summary: 'Admin: Delete customer' })
  @Delete('customers/:id')
  deleteCustomer(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteUser(id);
  }

  // ────────────────────────────────────────────────────
  // 💳 Wallet Recharges & Payments (تسديدات وشحن أرصدة المغاسل)
  // ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Admin: Recharge laundry balance (إضافة رصيد عند سداد المغسلة)' })
  @Post('laundries/:id/balance')
  addLaundryBalance(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RechargeBalanceDto,
  ) {
    return this.adminService.addBalance(id, req.user.id, dto);
  }

  @ApiOperation({ summary: 'Admin: Get laundry balance recharge history (سجل تسديدات مغسلة معينة)' })
  @Get('laundries/:id/balance-history')
  getLaundryBalanceHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.adminService.getBalanceHistory(id, { limit, offset });
  }

  @ApiOperation({ summary: 'Admin: Get all wallet recharges history (سجل جميع التسديدات في النظام)' })
  @Get('recharges')
  getAllRecharges(
    @Query('laundryId') laundryId?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.adminService.getAllRecharges({ laundryId, search, limit, offset });
  }
}
