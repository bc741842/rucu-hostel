import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
 
const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  'Pending',
  'Paid',
  'Confirmed',
  'CheckedIn',
];
 
@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditLogService: AuditLogService,
  ) {}
 
  // Admin/Warden/Accountant: create a new announcement.
  // adminUserId is the id of the User (not Student) who is posting it.
  // file is optional - a PDF attached alongside the announcement.
  async create(
    adminUserId: string,
    dto: CreateAnnouncementDto,
    file?: Express.Multer.File,
    ip?: string,
  ) {
    if (dto.hostelId) {
      const hostel = await this.prisma.hostel.findUnique({
        where: { id: dto.hostelId },
      });
      if (!hostel) {
        throw new NotFoundException('Hostel not found.');
      }
    }
 
    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title,
        message: dto.message,
        hostelId: dto.hostelId || null,
        createdBy: adminUserId,
        documentTitle: file ? dto.documentTitle || file.originalname : null,
        fileName: file ? file.originalname : null,
        filePath: file ? file.path : null,
        fileSize: file ? file.size : null,
      },
      include: {
        hostel: true,
        author: { select: { id: true, name: true, role: true } },
      },
    });
 
    // Notify the right students: everyone, or just the targeted hostel.
    const notifyTitle = `New announcement: ${dto.title}`;
    if (dto.hostelId) {
      await this.notificationsService.createForHostel(
        dto.hostelId,
        notifyTitle,
        dto.message,
        '/dashboard/announcements',
      );
    } else {
      await this.notificationsService.createForAllStudents(
        notifyTitle,
        dto.message,
        '/dashboard/announcements',
      );
    }
 
    await this.auditLogService.log({
      actorId: adminUserId,
      action: 'announcement.create',
      description: `Posted announcement "${dto.title}"${
        announcement.hostel ? ` to ${announcement.hostel.name}` : ' to all hostels'
      }${file ? ` with attached document "${file.originalname}"` : ''}`,
      entityType: 'Announcement',
      entityId: announcement.id,
      after: {
        title: dto.title,
        message: dto.message,
        hostelId: dto.hostelId ?? null,
        fileName: file ? file.originalname : null,
      },
      ip,
    });
 
    return announcement;
  }
 
  // Admin/Warden: full list of every announcement, newest first.
  async findAll() {
    return this.prisma.announcement.findMany({
      include: {
        hostel: true,
        author: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
 
  // Student: announcements meant for everyone, plus announcements targeted
  // at the hostel they are currently booked into (if any).
  async findForStudent(studentId: string) {
    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        studentId,
        status: { in: ACTIVE_BOOKING_STATUSES },
      },
      include: { bed: { include: { room: true } } },
      orderBy: { createdAt: 'desc' },
    });
 
    const hostelId = activeBooking?.bed.room.hostelId;
 
    return this.prisma.announcement.findMany({
      where: {
        OR: [{ hostelId: null }, ...(hostelId ? [{ hostelId }] : [])],
      },
      include: {
        hostel: true,
        author: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
 
  // Anyone logged in: fetch one announcement's metadata (used to resolve
  // the file path before streaming it down in the controller).
  async findOne(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) {
      throw new NotFoundException('Announcement not found.');
    }
    return announcement;
  }
 
  // Admin/Warden: delete an announcement.
  async remove(id: string, actorId: string, ip?: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) {
      throw new NotFoundException('Announcement not found.');
    }
 
    // NOTE: the PDF itself stays on Cloudinary even after this delete -
    // that's fine, the free Cloudinary plan has plenty of storage for a
    // project this size.
    await this.prisma.announcement.delete({ where: { id } });
 
    await this.auditLogService.log({
      actorId,
      action: 'announcement.delete',
      description: `Deleted announcement "${announcement.title}"`,
      entityType: 'Announcement',
      entityId: announcement.id,
      before: {
        title: announcement.title,
        message: announcement.message,
        fileName: announcement.fileName,
      },
      ip,
    });
 
    return { success: true };
  }
}
 