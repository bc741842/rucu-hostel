import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
 
@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}
 
  /**
   * Creates a notification for a student. Other modules (maintenance,
   * announcements, payment, …) call this whenever something worth telling
   * the student about happens. Also emails the student, if they have an
   * email on file — email sending never blocks or fails this call.
   */
  async create(
    studentId: string,
    title: string,
    message: string,
    link?: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: { studentId, title, message, link },
    });
 
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { email: true, name: true },
    });
 
    if (student?.email) {
      void this.emailService.sendMail(
        student.email,
        title,
        `Hello ${student.name},\n\n${message}`,
      );
    }
 
    return notification;
  }
 
  /** Same as create(), but for every student currently in a given hostel's
   * active booking — used for hostel-wide events like a new announcement. */
  async createForHostel(
    hostelId: string,
    title: string,
    message: string,
    link?: string,
  ) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { in: ['Pending', 'Paid', 'Confirmed', 'CheckedIn'] },
        bed: { room: { hostelId } },
      },
      select: {
        studentId: true,
        student: { select: { email: true, name: true } },
      },
      distinct: ['studentId'],
    });
 
    if (bookings.length === 0) return;
 
    await this.prisma.notification.createMany({
      data: bookings.map((b) => ({
        studentId: b.studentId,
        title,
        message,
        link,
      })),
    });
 
    for (const b of bookings) {
      if (b.student?.email) {
        void this.emailService.sendMail(
          b.student.email,
          title,
          `Hello ${b.student.name},\n\n${message}`,
        );
      }
    }
  }
 
  /** Same as createForHostel(), but for every student in the system —
   * used for a global announcement (no specific hostel targeted). */
  async createForAllStudents(title: string, message: string, link?: string) {
    const students = await this.prisma.student.findMany({
      select: { id: true, email: true, name: true },
    });
 
    if (students.length === 0) return;
 
    await this.prisma.notification.createMany({
      data: students.map((s) => ({
        studentId: s.id,
        title,
        message,
        link,
      })),
    });
 
    for (const s of students) {
      if (s.email) {
        void this.emailService.sendMail(
          s.email,
          title,
          `Hello ${s.name},\n\n${message}`,
        );
      }
    }
  }
 
  async getMyNotifications(studentId: string) {
    return this.prisma.notification.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
 
  async getUnreadCount(studentId: string) {
    const count = await this.prisma.notification.count({
      where: { studentId, isRead: false },
    });
    return { count };
  }
 
  async markRead(studentId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (notification.studentId !== studentId) {
      throw new ForbiddenException('This notification does not belong to you');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
 
  async markAllRead(studentId: string) {
    await this.prisma.notification.updateMany({
      where: { studentId, isRead: false },
      data: { isRead: true },
    });
    return { ok: true };
  }
}
 