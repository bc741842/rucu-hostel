import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
 
interface LogParams {
  actorId: string;
  action: string; // short machine-readable code, e.g. "payment.confirm"
  description: string; // human-readable summary, e.g. "Confirmed payment of 150,000 for RU/BCS/2024/321"
  entityType?: string; // e.g. "Payment", "MaintenanceRequest", "Room"
  entityId?: string;
  before?: Record<string, any> | null; // state before the change, for data-change audits
  after?: Record<string, any> | null; // state after the change
  ip?: string;
}
 
interface GetLogsFilters {
  actorId?: string;
  action?: string;
  from?: Date;
  to?: Date;
}
 
@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}
 
  /**
   * Records one audit log entry. Looks up the actor's current name/role from
   * the User table so the log always shows who did it, even if their role
   * changes later. Never throws — a logging failure should never block the
   * action that triggered it.
   */
  async log(params: LogParams) {
    try {
      const actor = await this.prisma.user.findUnique({
        where: { id: params.actorId },
        select: { name: true, role: true },
      });
 
      await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId,
          actorName: actor?.name ?? 'Unknown',
          actorRole: actor?.role ?? 'unknown',
          action: params.action,
          description: params.description,
          entityType: params.entityType,
          entityId: params.entityId,
          beforeData: params.before ?? undefined,
          afterData: params.after ?? undefined,
          ipAddress: params.ip,
        },
      });
    } catch {
      // Swallow logging errors — auditing must never break the real action.
    }
  }
 
  async getLogs(filters: GetLogsFilters) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(filters.actorId ? { actorId: filters.actorId } : {}),
        ...(filters.action
          ? { action: { contains: filters.action, mode: 'insensitive' } }
          : {}),
        ...(filters.from || filters.to
          ? {
              createdAt: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
  }
 
  /** Distinct actors who have at least one log entry — used to populate the
   * "Staff member" filter dropdown on the frontend. */
  async getActors() {
    const logs = await this.prisma.auditLog.findMany({
      distinct: ['actorId'],
      select: { actorId: true, actorName: true, actorRole: true },
      orderBy: { createdAt: 'desc' },
    });
    return logs;
  }
}
 