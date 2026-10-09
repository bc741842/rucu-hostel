import { Injectable } from '@nestjs/common';
import { BookingStatus, MaintenanceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
 
// Any of these means the bed is considered "occupied" for the purposes of
// occupancy reporting (held, paid for, confirmed, or already checked in).
const OCCUPIED_STATUSES: BookingStatus[] = [
  'Pending',
  'Paid',
  'Confirmed',
  'CheckedIn',
];
 
@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}
 
  async getDashboard(academicYearId: string) {
    const [hostels, bookings, paidPayments, maintenanceCounts, waitingCounts] =
      await Promise.all([
        this.prisma.hostel.findMany({
          include: { rooms: { include: { beds: true } } },
        }),
        this.prisma.booking.findMany({
          where: { academicYearId },
          include: { bed: { include: { room: true } } },
        }),
        this.prisma.payment.findMany({
          where: { booking: { academicYearId }, status: 'completed' },
        }),
        this.prisma.maintenanceRequest.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.waitingList.groupBy({
          by: ['hostelId'],
          where: { academicYearId, status: 'waiting' },
          _count: { _all: true },
        }),
      ]);
 
    // --- Occupancy, per hostel ---
    const occupancy = hostels.map((h) => {
      const totalBeds = h.rooms.reduce((sum, r) => sum + r.beds.length, 0);
      const occupiedBeds = bookings.filter(
        (b) =>
          b.bed.room.hostelId === h.id && OCCUPIED_STATUSES.includes(b.status),
      ).length;
      return {
        hostelId: h.id,
        hostel: h.name,
        totalBeds,
        occupiedBeds,
        freeBeds: Math.max(totalBeds - occupiedBeds, 0),
        occupancyRate:
          totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      };
    });
 
    const overallTotalBeds = occupancy.reduce((s, o) => s + o.totalBeds, 0);
    const overallOccupiedBeds = occupancy.reduce(
      (s, o) => s + o.occupiedBeds,
      0,
    );
 
    // --- Revenue ---
    const totalRevenue = paidPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const revenueByMonth: Record<string, number> = {};
    for (const p of paidPayments) {
      if (!p.paidAt) continue;
      const key = `${p.paidAt.getFullYear()}-${String(
        p.paidAt.getMonth() + 1,
      ).padStart(2, '0')}`;
      revenueByMonth[key] = (revenueByMonth[key] || 0) + Number(p.amount);
    }
    const revenueTrend = Object.entries(revenueByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }));
 
    // --- Check-ins ---
    const checkedIn = bookings.filter((b) => b.status === 'CheckedIn').length;
    const paidNotCheckedIn = bookings.filter(
      (b) => b.status === 'Paid' || b.status === 'Confirmed',
    ).length;
 
    // --- Maintenance (current snapshot, not scoped to academic year) ---
    const maintenance: Record<MaintenanceStatus, number> = {
      Open: 0,
      InProgress: 0,
      Resolved: 0,
    };
    for (const row of maintenanceCounts) {
      maintenance[row.status] = row._count._all;
    }
 
    // --- Waiting list, per hostel ---
    const hostelNameById = new Map(hostels.map((h) => [h.id, h.name]));
    const waitingList = waitingCounts.map((w) => ({
      hostelId: w.hostelId,
      hostel: hostelNameById.get(w.hostelId) ?? 'Unknown',
      count: w._count._all,
    }));
 
    return {
      occupancy,
      overall: {
        totalBeds: overallTotalBeds,
        occupiedBeds: overallOccupiedBeds,
        occupancyRate:
          overallTotalBeds > 0
            ? Math.round((overallOccupiedBeds / overallTotalBeds) * 100)
            : 0,
      },
      revenue: { total: totalRevenue, trend: revenueTrend },
      checkIns: { checkedIn, paidNotCheckedIn },
      maintenance,
      waitingList,
    };
  }
}
 