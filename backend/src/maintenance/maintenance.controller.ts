import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MaintenanceStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
 
@UseGuards(JwtAuthGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}
 
  // Student: report a new issue
  @Post()
  createRequest(@Req() req: any, @Body() dto: CreateMaintenanceRequestDto) {
    return this.maintenanceService.createRequest(req.user.studentId, dto);
  }
 
  // Student: see my own reports
  @Get('my')
  getMyRequests(@Req() req: any) {
    return this.maintenanceService.getMyRequests(req.user.studentId);
  }
 
  // Admin/Warden: see all reports, optionally filtered
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'warden')
  @Get('admin')
  getAllRequests(
    @Query('hostelId') hostelId?: string,
    @Query('status') status?: MaintenanceStatus,
  ) {
    return this.maintenanceService.getAllRequests(hostelId, status);
  }
 
  // Admin/Warden: move a report through Open -> In Progress -> Resolved
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'warden')
  @Patch('admin/:id/status')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceStatusDto,
  ) {
    return this.maintenanceService.updateStatus(
      id,
      req.user.userId,
      dto,
      req.ip,
    );
  }
}
 