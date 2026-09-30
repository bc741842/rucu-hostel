import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
 
const ADMIN_PAYMENT_INCLUDE = {
  booking: {
    include: {
      student: {
        select: { id: true, regNo: true, name: true },
      },
      bed: { include: { room: { include: { hostel: true } } } },
      academicYear: true,
    },
  },
};
 
@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}
 
  async getMyPayments(studentId: string) {
    return this.prisma.payment.findMany({
      where: { booking: { studentId } },
      include: {
        booking: {
          include: {
            bed: { include: { room: { include: { hostel: true } } } },
            academicYear: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }
 
  async getAllPayments(status?: string) {
    return this.prisma.payment.findMany({
      where: status ? { status } : undefined,
      include: ADMIN_PAYMENT_INCLUDE,
      orderBy: { id: 'desc' },
    });
  }
 
  async confirmPayment(paymentId: string, adminUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { booking: true },
      });
 
      if (!payment) {
        throw new NotFoundException('Payment haipo');
      }
 
      if (payment.status === 'completed') {
        throw new ConflictException('Payment hii tayari imethibitishwa');
      }
 
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'completed',
          paidAt: new Date(),
          channel: 'manual_admin_confirmation',
        },
      });
 
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'Paid' },
      });
 
      return updatedPayment;
    });
  }
}
 