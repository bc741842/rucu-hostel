import {
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
 
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}
 
  @Get('my')
  getMyNotifications(@Req() req: any) {
    return this.notificationsService.getMyNotifications(req.user.studentId);
  }
 
  @Get('my/unread-count')
  getUnreadCount(@Req() req: any) {
    return this.notificationsService.getUnreadCount(req.user.studentId);
  }
 
  @Patch(':id/read')
  markRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.markRead(req.user.studentId, id);
  }
 
  @Patch('my/read-all')
  markAllRead(@Req() req: any) {
    return this.notificationsService.markAllRead(req.user.studentId);
  }
}
 