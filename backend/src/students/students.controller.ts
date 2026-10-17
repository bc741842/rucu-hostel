import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StudentsService } from './students.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'warden')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  search(@Query('search') search: string) {
    return this.studentsService.search(search);
  }

  @Post(':id/reset-password')
  resetPassword(@Param('id') id: string, @Req() req: any) {
    return this.studentsService.resetPassword(id, req.user.userId, req.ip);
  }
}
