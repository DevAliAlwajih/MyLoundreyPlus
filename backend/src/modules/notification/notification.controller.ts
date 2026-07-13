import { Controller, Get, Patch, Param, Query, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /** GET /api/v1/notifications — قائمة إشعارات المستخدم */
  @Get()
  getNotifications(@Req() req: any, @Query() query: QueryNotificationsDto) {
    return this.notificationService.getNotifications(
      req.user.id,
      query.page,
      query.limit,
      query.unreadOnly,
    );
  }

  /** GET /api/v1/notifications/unread-count — عدد غير المقروءة
   *  ⚠️ يجب أن يكون قبل /:id/read لتجنب تعارض الـ Route
   */
  @Get('unread-count')
  getUnreadCount(@Req() req: any) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  /** PATCH /api/v1/notifications/read-all — تحديد الكل كمقروء
   *  ⚠️ يجب أن يكون قبل /:id/read لتجنب تعارض الـ Route
   */
  @Patch('read-all')
  markAllAsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  /** PATCH /api/v1/notifications/:id/read — تحديد إشعار واحد كمقروء */
  @Patch(':id/read')
  markAsRead(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationService.markAsRead(req.user.id, id);
  }
}
