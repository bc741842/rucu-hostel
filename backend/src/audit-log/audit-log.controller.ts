import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditLogService } from './audit-log.service';
 
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}
 
  @Get()
  getLogs(
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditLogService.getLogs({
      actorId,
      action,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }
 
  @Get('actors')
  getActors() {
    return this.auditLogService.getActors();
  }
}
 