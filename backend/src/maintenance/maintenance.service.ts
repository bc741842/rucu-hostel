import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { BookingStatus, MaintenanceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
 
const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  'Pending',
  'Paid',
  'Confirmed',
  'CheckedIn',
];
 
const REQUEST_INCLUDE = {
  student: {
    select: { id: true, name: true, regNo: true, phone: true },
  },
  hostel: { select: { id: true, name: true } },
  resolvedBy: { select: { id: true, name: true } },
};
 
@Injectable()
export class MaintenanceService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private auditLogService: AuditLogService,
  ) {}
 
  private async getStudentHostelId(studentId: string): Promise<string | null> {
    const booking = await this.prisma.booking.findFirst({
      where: { studentId, status: { in: ACTIVE_BOOKING_STATUSES } },
      include: { bed: { include: { room: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return booking?.bed.room.hostelId ?? null;
  }
 
  async createRequest(studentId: string, dto: CreateMaintenanceRequestDto) {
    const hostelId = await this.getStudentHostelId(studentId);
    if (!hostelId) {
      throw new ConflictException(
        'You need an active bed booking before you can report a maintenance issue.',
      );
    }
 
    return this.prisma.maintenanceRequest.create({
      data: {
        studentId,
        hostelId,
        location: dto.location,
        description: dto.description,
      },
      include: REQUEST_INCLUDE,
    });
  }
 
  async getMyRequests(studentId: string) {
    return this.prisma.maintenanceRequest.findMany({
      where: { studentId },
      include: REQUEST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }
 
  async getAllRequests(hostelId?: string, status?: MaintenanceStatus) {
    return this.prisma.maintenanceRequest.findMany({
      where: {
        ...(hostelId ? { hostelId } : {}),
        ...(status ? { status } : {}),
      },
      include: REQUEST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }
 
  async updateStatus(
    id: string,
    userId: string,
    dto: UpdateMaintenanceStatusDto,
    ip?: string,
  ) {
    const existing = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Maintenance request not found');
    }
 
    const updated = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: dto.status,
        resolvedNote: dto.resolvedNote ?? existing.resolvedNote,
        ...(dto.status === 'Resolved'
          ? { resolvedAt: new Date(), resolvedById: userId }
          : { resolvedAt: null, resolvedById: null }),
      },
      include: REQUEST_INCLUDE,
    });
 
    if (dto.status === 'Resolved' && existing.status !== 'Resolved') {
      await this.notificationsService.create(
        updated.studentId,
        'Maintenance issue resolved',
        `Your report about "${updated.location}" has been marked resolved.` +
          (dto.resolvedNote ? ` Note: ${dto.resolvedNote}` : ''),
        '/dashboard/maintenance',
      );
    } else if (dto.status === 'InProgress' && existing.status === 'Open') {
      await this.notificationsService.create(
        updated.studentId,
        'Maintenance issue in progress',
        `Work has started on your report about "${updated.location}".`,
        '/dashboard/maintenance',
      );
    }
 
    if (existing.status !== dto.status) {
      await this.auditLogService.log({
        actorId: userId,
        action: 'maintenance.status_update',
        description: `Changed maintenance request (${updated.location}, reported by ${updated.student.name}) status from ${existing.status} to ${dto.status}`,
        entityType: 'MaintenanceRequest',
        entityId: updated.id,
        before: { status: existing.status },
        after: { status: dto.status, resolvedNote: dto.resolvedNote ?? null },
        ip,
      });
    }
 
    return updated;
  }
}
 