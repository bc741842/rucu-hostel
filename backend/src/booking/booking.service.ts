import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
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
 
// A booking can only be checked in once it has been paid for (Paid) or
// explicitly confirmed by the accountant/admin (Confirmed).
const CHECK_IN_ELIGIBLE_STATUSES: BookingStatus[] = ['Paid', 'Confirmed'];
 
// Hostels whose "gender_allowed" value is one of these are open to every
// student, regardless of their own gender.
const OPEN_TO_ALL_GENDERS = ['mixed', 'all', 'any', 'both'];
 
function hostelAllowsStudent(genderAllowed: string, studentGender: string): boolean {
  const allowed = genderAllowed.trim().toLowerCase();
  if (OPEN_TO_ALL_GENDERS.includes(allowed)) {
    return true;
  }
  return allowed === studentGender.trim().toLowerCase();
}
 
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
 
const CHECK_IN_INCLUDE = {
  student: {
    select: { id: true, name: true, regNo: true, gender: true, course: true },
  },
  bed: {
    include: {
      room: {
        include: {
          hostel: true,
        },
      },
    },
  },
};
 
@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
 
  constructor(private prisma: PrismaService) {}
 
  // Only returns free beds in hostels that match the student's own gender
  // (or a hostel marked open to everyone). This is what populates the
  // "Book a Bed" list, so a student never even sees a hostel that isn't
  // meant for them.
  async getAvailableBeds(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
 
    const beds = await this.prisma.bed.findMany({
      where: { status: 'free' },
      include: {
        room: {
          include: {
            hostel: true,
          },
        },
      },
    });
 
    return beds.filter((bed) =>
      hostelAllowsStudent(bed.room.hostel.genderAllowed, student.gender),
    );
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
      const student = await tx.student.findUnique({
        where: { id: studentId },
      });
      if (!student) {
        throw new NotFoundException('Student not found');
      }
 
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
        include: { room: { include: { hostel: true } } },
      });
 
      if (!bed) {
        throw new NotFoundException('Bed not found');
      }
 
      // Server-side guard: even if a student somehow calls this endpoint
      // directly for a hostel not meant for their gender, block it here.
      if (!hostelAllowsStudent(bed.room.hostel.genderAllowed, student.gender)) {
        throw new ForbiddenException(
          `${bed.room.hostel.name} is not available for your gender.`,
        );
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
        include: { payment: true },
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
 
      // Ghairi pia control number/payment inayohusiana, isibaki
      // ikihesabiwa kama "pending" hewani.
      if (booking.payment && booking.payment.status === 'pending') {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: 'cancelled' },
        });
      }
 
      return updated;
    });
  }
 
  // ---------------------------------------------------------------------
  // QR Check-in
  // ---------------------------------------------------------------------
 
  /**
   * Returns the current student's check-in QR code, generating and saving
   * one on first request if the booking doesn't have one yet (handles
   * bookings created before this feature existed).
   */
  async getMyQrCode(studentId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        studentId,
        status: { in: [...CHECK_IN_ELIGIBLE_STATUSES, 'CheckedIn'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        bed: { include: { room: { include: { hostel: true } } } },
      },
    });
 
    if (!booking) {
      throw new NotFoundException(
        'You need a paid (or confirmed) booking before a check-in QR code can be issued.',
      );
    }
 
    let { qrCode } = booking;
    if (!qrCode) {
      qrCode = randomUUID();
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { qrCode },
      });
    }
 
    return {
      qrCode,
      bookingId: booking.id,
      status: booking.status,
      checkedInAt: booking.checkedInAt,
      hostel: booking.bed.room.hostel.name,
      room: booking.bed.room.number,
      bed: booking.bed.number,
    };
  }
 
  /**
   * Admin/Warden: scan a student's QR code and mark them as checked in.
   */
  async checkInByCode(code: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { qrCode: code },
      include: CHECK_IN_INCLUDE,
    });
 
    if (!booking) {
      throw new NotFoundException('Invalid QR code. No matching booking was found.');
    }
 
    if (booking.status === 'CheckedIn') {
      throw new ConflictException(
        `${booking.student.name} (${booking.student.regNo}) is already checked in.`,
      );
    }
 
    if (!CHECK_IN_ELIGIBLE_STATUSES.includes(booking.status)) {
      throw new ConflictException(
        `This booking cannot be checked in yet (status: ${booking.status}). ` +
          'Payment must be completed first.',
      );
    }
 
    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CheckedIn', checkedInAt: new Date() },
      include: CHECK_IN_INCLUDE,
    });
 
    this.logger.log(
      `Checked in ${updated.student.regNo} into ${updated.bed.room.hostel.name} ${updated.bed.room.number}/${updated.bed.number}`,
    );
 
    return updated;
  }
 
  // ---------------------------------------------------------------------
  // Roommates
  // ---------------------------------------------------------------------
 
  /**
   * Returns the other students currently booked into the same room (any
   * bed) as the requesting student's own active booking.
   */
  async getMyRoommates(studentId: string) {
    const myBooking = await this.prisma.booking.findFirst({
      where: { studentId, status: { in: ACTIVE_STATUSES } },
      orderBy: { createdAt: 'desc' },
      include: {
        bed: { include: { room: { include: { hostel: true } } } },
      },
    });
 
    if (!myBooking) {
      throw new NotFoundException(
        'You need an active bed booking to see your roommates.',
      );
    }
 
    const roomId = myBooking.bed.roomId;
 
    const roommateBookings = await this.prisma.booking.findMany({
      where: {
        bed: { roomId },
        status: { in: ACTIVE_STATUSES },
        studentId: { not: studentId },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            regNo: true,
            course: true,
            year: true,
            phone: true,
            email: true,
            gender: true,
          },
        },
        bed: true,
      },
      orderBy: { bed: { number: 'asc' } },
    });
 
    return {
      hostel: myBooking.bed.room.hostel.name,
      room: myBooking.bed.room.number,
      myBed: myBooking.bed.number,
      roommates: roommateBookings.map((b) => ({
        bed: b.bed.number,
        status: b.status,
        name: b.student.name,
        regNo: b.student.regNo,
        course: b.student.course,
        year: b.student.year,
        gender: b.student.gender,
        phone: b.student.phone,
        email: b.student.email,
      })),
    };
  }
 
  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireOldHolds() {
    const now = new Date();
    const expired = await this.prisma.booking.findMany({
      where: {
        status: 'Pending',
        expiresAt: { lt: now },
      },
      include: { payment: true },
    });
 
    for (const booking of expired) {
      await this.prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'Expired' },
        });
        await tx.bed.update({
          where: { id: booking.bedId },
          data: { status: 'free' },
        });
        if (booking.payment && booking.payment.status === 'pending') {
          await tx.payment.update({
            where: { id: booking.payment.id },
            data: { status: 'cancelled' },
          });
        }
      });
      this.logger.log(`Booking ${booking.id} expired, bed freed.`);
    }
  }
}
 