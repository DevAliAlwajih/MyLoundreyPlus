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
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { QueryAdminLaundriesDto, QueryAdminUsersDto } from './dto/query-admin.dto';
import { UpdateLaundryStatusDto } from './dto/update-laundry-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ────────────────────────────────────────────────────
  // 📊 Analytics
  // ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Admin: Get overview analytics' })
  @Get('analytics/overview')
  getOverview() {
    return this.adminService.getOverview();
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

  @ApiOperation({ summary: 'Admin: Update laundry status' })
  @Patch('laundries/:id/status')
  updateLaundryStatus(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLaundryStatusDto,
  ) {
    return this.adminService.updateLaundryStatus(id, req.user.id, dto);
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
}
