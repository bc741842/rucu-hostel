import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

// No 0/O/1/l/I so a password read out loud or copied by hand is not misread.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function makeTempPassword(length = 8): string {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  /** Search students by name or registration number (never returns passwords). */
  async search(term: string) {
    const q = (term ?? '').trim();
    if (q.length < 2) return [];
    return this.prisma.student.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { regNo: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        regNo: true,
        name: true,
        course: true,
        year: true,
        phone: true,
        email: true,
      },
      orderBy: { name: 'asc' },
      take: 20,
    });
  }

  /**
   * Admin/warden sets a random temporary password for a student who cannot
   * use the email reset. The plain password is returned ONCE and never stored.
   */
  async resetPassword(id: string, actorId: string, ip?: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found.');

    const temporaryPassword = makeTempPassword();
    await this.prisma.student.update({
      where: { id },
      data: { password: await bcrypt.hash(temporaryPassword, 10) },
    });

    await this.auditLogService.log({
      actorId,
      action: 'student.password_reset',
      description: `Set a temporary password for ${student.name} (${student.regNo})`,
      entityType: 'Student',
      entityId: student.id,
      ip,
    });

    return {
      regNo: student.regNo,
      name: student.name,
      temporaryPassword,
    };
  }
}
