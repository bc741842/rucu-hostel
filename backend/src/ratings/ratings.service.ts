import { Injectable, ConflictException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';
 
const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  'Pending',
  'Paid',
  'Confirmed',
  'CheckedIn',
];
 
@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}
 
  /** Finds the student's current hostel + academic year from their active booking. */
  private async getCurrentStay(studentId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { studentId, status: { in: ACTIVE_BOOKING_STATUSES } },
      orderBy: { createdAt: 'desc' },
      include: { bed: { include: { room: true } } },
    });
    if (!booking) return null;
    return {
      hostelId: booking.bed.room.hostelId,
      academicYearId: booking.academicYearId,
    };
  }
 
  async rateMyHostel(studentId: string, dto: CreateRatingDto) {
    const stay = await this.getCurrentStay(studentId);
    if (!stay) {
      throw new ConflictException(
        'You need an active bed booking before you can rate your hostel.',
      );
    }
 
    return this.prisma.hostelRating.upsert({
      where: {
        studentId_hostelId_academicYearId: {
          studentId,
          hostelId: stay.hostelId,
          academicYearId: stay.academicYearId,
        },
      },
      create: {
        studentId,
        hostelId: stay.hostelId,
        academicYearId: stay.academicYearId,
        rating: dto.rating,
        comment: dto.comment,
      },
      update: {
        rating: dto.rating,
        comment: dto.comment,
      },
      include: { hostel: { select: { name: true } } },
    });
  }
 
  async getMyRating(studentId: string) {
    const stay = await this.getCurrentStay(studentId);
    if (!stay) return null;
 
    return this.prisma.hostelRating.findUnique({
      where: {
        studentId_hostelId_academicYearId: {
          studentId,
          hostelId: stay.hostelId,
          academicYearId: stay.academicYearId,
        },
      },
      include: { hostel: { select: { name: true } } },
    });
  }
 
  async getAdminSummary(hostelId?: string, academicYearId?: string) {
    const ratings = await this.prisma.hostelRating.findMany({
      where: {
        ...(hostelId ? { hostelId } : {}),
        ...(academicYearId ? { academicYearId } : {}),
      },
      include: {
        student: { select: { name: true, regNo: true } },
        hostel: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
 
    const byHostel = new Map<
      string,
      { hostelId: string; hostel: string; total: number; count: number }
    >();
    for (const r of ratings) {
      const entry = byHostel.get(r.hostelId) ?? {
        hostelId: r.hostelId,
        hostel: r.hostel.name,
        total: 0,
        count: 0,
      };
      entry.total += r.rating;
      entry.count += 1;
      byHostel.set(r.hostelId, entry);
    }
 
    const summary = Array.from(byHostel.values()).map((h) => ({
      hostelId: h.hostelId,
      hostel: h.hostel,
      average: h.count > 0 ? Math.round((h.total / h.count) * 10) / 10 : 0,
      count: h.count,
    }));
 
    return { summary, ratings };
  }
}
 