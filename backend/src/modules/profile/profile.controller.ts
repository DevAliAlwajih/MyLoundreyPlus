import { Controller, Get, Patch, Delete, Body, Param, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@Req() req: any) {
    return this.profileService.getProfile(req.user.id);
  }

  @Patch()
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.id, dto);
  }

  @Patch('password')
  updatePassword(@Req() req: any, @Body() dto: UpdatePasswordDto) {
    return this.profileService.updatePassword(req.user.id, dto);
  }

  @Get('devices')
  getDevices(@Req() req: any) {
    return this.profileService.getDevices(req.user.id);
  }

  @Delete('devices/:id')
  deactivateDevice(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.profileService.deactivateDevice(req.user.id, id);
  }
}
