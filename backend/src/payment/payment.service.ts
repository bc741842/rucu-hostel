import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PaymentWebhookDto } from './payment-webhook.dto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogService } from '../audit-log/audit-log.service';
 
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
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private auditLogService: AuditLogService,
  ) {}
 
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
 
  async confirmPayment(paymentId: string, adminUserId: string, ip?: string) {
    const updatedPayment = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { booking: { include: { student: true } } },
      });
 
      if (!payment) {
        throw new NotFoundException('Payment haipo');
      }
 
      if (payment.status === 'completed') {
        throw new ConflictException('Payment hii tayari imethibitishwa');
      }
 
      const previousStatus = payment.status;
 
      const updated = await tx.payment.update({
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
 
      return {
        ...updated,
        studentId: payment.booking.studentId,
        studentName: payment.booking.student.name,
        studentRegNo: payment.booking.student.regNo,
        previousStatus,
      };
    });
 
    // Notify the student their payment has been confirmed.
    await this.notificationsService.create(
      updatedPayment.studentId,
      'Payment confirmed',
      `Your payment of ${updatedPayment.amount} has been confirmed. Your booking is now Paid.`,
      '/dashboard/payments',
    );
 
    // Audit trail — who confirmed this payment, and the before/after state.
    await this.auditLogService.log({
      actorId: adminUserId,
      action: 'payment.confirm',
      description: `Confirmed payment of ${updatedPayment.amount} for ${updatedPayment.studentName} (${updatedPayment.studentRegNo})`,
      entityType: 'Payment',
      entityId: updatedPayment.id,
      before: { status: updatedPayment.previousStatus },
      after: { status: 'completed', paidAt: updatedPayment.paidAt },
      ip,
    });
 
    return updatedPayment;
  }

  /**
   * A payment provider reports that a control number was paid. Confirms the
   * payment and the booking automatically. Safe to call twice with the same
   * provider reference (the second call changes nothing).
   */
  async confirmFromGateway(dto: PaymentWebhookDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { controlNumber: dto.controlNumber },
      include: { booking: { include: { student: true } } },
    });
    if (!payment) throw new NotFoundException('Unknown control number.');

    const already = await this.prisma.paymentCallback.findUnique({
      where: { gatewayRef: dto.reference },
    });
    if (already || payment.status === 'completed') {
      return { status: 'already_confirmed', controlNumber: dto.controlNumber };
    }

    if (payment.status !== 'pending') {
      // Money arrived for a booking that was cancelled or expired: do not
      // re-open it automatically - a person must decide (refund or re-book).
      this.logger.warn(
        `Payment ${dto.controlNumber} received but its status is "${payment.status}"; needs manual review.`,
      );
      throw new ConflictException(
        `Payment is ${payment.status}; manual review needed.`,
      );
    }

    if (Number(dto.amount) < Number(payment.amount)) {
      this.logger.warn(
        `Payment ${dto.controlNumber}: received ${dto.amount}, expected ${payment.amount}. Not confirmed.`,
      );
      throw new ConflictException('Amount received is less than the amount due.');
    }

    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.paymentCallback.create({
          data: { paymentId: payment.id, gatewayRef: dto.reference },
        });
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'completed', paidAt, channel: 'gateway_auto' },
        });
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'Paid' },
        });
      });
    } catch (err: any) {
      // Same reference arrived twice at the same moment.
      if (err?.code === 'P2002') {
        return { status: 'already_confirmed', controlNumber: dto.controlNumber };
      }
      throw err;
    }

    await this.notificationsService.create(
      payment.booking.studentId,
      'Payment confirmed',
      `Your payment of ${payment.amount} has been received and confirmed automatically. Your booking is now Paid.`,
      '/dashboard/payments',
    );

    // No staff member acted, so write the audit entry as the system.
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: 'system',
          actorName: 'Payment gateway',
          actorRole: 'system',
          action: 'payment.auto_confirm',
          description: `Automatically confirmed payment of ${payment.amount} for ${payment.booking.student.name} (${payment.booking.student.regNo}), ref ${dto.reference}`,
          entityType: 'Payment',
          entityId: payment.id,
          beforeData: { status: payment.status },
          afterData: { status: 'completed', paidAt, reference: dto.reference },
        },
      });
    } catch {
      // Logging must never undo a confirmed payment.
    }

    return { status: 'confirmed', controlNumber: dto.controlNumber };
  }
}
