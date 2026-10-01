import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
 
const HOLD_DURATION_HOURS = 24;
const ACTIVE_STATUSES: BookingStatus[] = [
  'Pending',
  'Paid',
  'Confirmed',
  'CheckedIn',
];
 
const BOOKING_INCLUDE = {
  bed: {
    include: {
      room: {
        include: {
          hostel: true,
        },
      },
    },
  },
  academicYear: true,
  payment: true,
};
 
@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
 
  constructor(private prisma: PrismaService) {}
 
  async getAvailableBeds() {
    return this.prisma.bed.findMany({
      where: { status: 'free' },
      include: {
        room: {
          include: {
            hostel: true,
          },
        },
      },
    });
  }
 
  async getMyBookings(studentId: string) {
    return this.prisma.booking.findMany({
      where: { studentId },
      include: BOOKING_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }
 
  async createBooking(studentId: string, dto: CreateBookingDto) {
    const createdBookingId = await this.prisma.$transaction(async (tx) => {
      const existingStudentBooking = await tx.booking.findFirst({
        where: {
          studentId,
          academicYearId: dto.academicYearId,
          status: { in: ACTIVE_STATUSES },
        },
      });
 
      if (existingStudentBooking) {
        throw new ConflictException(
          'You already have an active booking for this academic year. ' +
            'Cancel it or wait for it to expire before booking another bed.',
        );
      }
 
      const bed = await tx.bed.findUnique({
        where: { id: dto.bedId },
        include: { room: true },
      });
 
      if (!bed) {
        throw new NotFoundException('Bed not found');
      }
 
      if (bed.status !== 'free') {
        throw new ConflictException('Bed is not available');
      }
 
      const academicYear = await tx.academicYear.findUnique({
        where: { id: dto.academicYearId },
      });
 
      if (!academicYear) {
        throw new NotFoundException('Academic year not found');
      }
 
      const existingBedBooking = await tx.booking.findFirst({
        where: {
          bedId: dto.bedId,
          academicYearId: dto.academicYearId,
          status: { in: ACTIVE_STATUSES },
        },
      });
 
      if (existingBedBooking) {
        throw new ConflictException('Bed already has an active booking');
      }
 
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + HOLD_DURATION_HOURS);
 
      const booking = await tx.booking.create({
        data: {
          studentId,
          bedId: dto.bedId,
          academicYearId: dto.academicYearId,
          status: 'Pending',
          expiresAt,
        },
      });
 
      await tx.bed.update({
        where: { id: dto.bedId },
        data: { status: 'held' },
      });
 
      const paymentsCount = await tx.payment.count();
      const yearTag = academicYear.name.replace('/', '');
      const sequence = String(paymentsCount + 1).padStart(6, '0');
      const controlNumber = `RUCU-${yearTag}-${sequence}`;
 
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          controlNumber,
          amount: bed.room.price,
          status: 'pending',
        },
      });
 
      return booking.id;
    });
 
    return this.prisma.booking.findUnique({
      where: { id: createdBookingId },
      include: BOOKING_INCLUDE,
    });
  }
 
  async cancelBooking(studentId: string, bookingId: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });
 
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }
 
      if (booking.studentId !== studentId) {
        throw new ForbiddenException('This booking does not belong to you');
      }
 
      if (booking.status !== 'Pending') {
        throw new ConflictException(
          'Only a pending (unpaid) booking can be cancelled. ' +
            'Contact the accountant for a paid booking.',
        );
      }
 
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'Cancelled' },
      });
 
      await tx.bed.update({
        where: { id: booking.bedId },
        data: { status: 'free' },
      });
 
      return updated;
    });
  }
 
  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireOldHolds() {
    const now = new Date();
    const expired = await this.prisma.booking.findMany({
      where: {
        status: 'Pending',
        expiresAt: { lt: now },
      },
    });
 
    for (const booking of expired) {
      await this.prisma.$transaction([
        this.prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'Expired' },
        }),
        this.prisma.bed.update({
          where: { id: booking.bedId },
          data: { status: 'free' },
        }),
      ]);
      this.logger.log(`Booking ${booking.id} expired, bed freed.`);
    }
  }
}
 