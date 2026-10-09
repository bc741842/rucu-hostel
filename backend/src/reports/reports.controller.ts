import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ReportsService } from './reports.service';
 
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'warden', 'accountant')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}
 
  @Get('dashboard')
  getDashboard(@Query('academicYearId') academicYearId: string) {
    return this.reportsService.getDashboard(academicYearId);
  }
}
 