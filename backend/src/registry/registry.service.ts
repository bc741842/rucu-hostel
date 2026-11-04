import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { detailsMatch, normalizeRegNo, parseRegistryCsv } from './registry.match';

@Injectable()
export class RegistryService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async summary() {
    const [count, latest] = await Promise.all([
      this.prisma.registeredStudent.count(),
      this.prisma.registeredStudent.findFirst({
        orderBy: { importedAt: 'desc' },
        select: { importedAt: true },
      }),
    ]);
    return {
      count,
      lastImportedAt: latest?.importedAt ?? null,
      // Sign-up is only checked once an official list has been uploaded.
      enforced: count > 0,
    };
  }

  /** Upload (or update) RUCU's list of students. Existing rows are updated. */
  async importCsv(csv: string, actorId: string, ip?: string) {
    const { records, errors } = parseRegistryCsv(csv);
    if (records.length === 0) {
      return { imported: 0, skipped: errors.length, errors: errors.slice(0, 10) };
    }
    const CHUNK = 200;
    for (let i = 0; i < records.length; i += CHUNK) {
      await this.prisma.$transaction(
        records.slice(i, i + CHUNK).map((r) => {
          const regKey = normalizeRegNo(r.regNo);
          const data = {
            regNo: r.regNo,
            name: r.name,
            course: r.course,
            year: r.year,
            gender: r.gender,
            importedAt: new Date(),
          };
          return this.prisma.registeredStudent.upsert({
            where: { regKey },
            create: { regKey, ...data },
            update: data,
          });
        }),
      );
    }
    await this.auditLogService.log({
      actorId,
      action: 'registry.import',
      description: `Imported ${records.length} students into the RUCU registry`,
      entityType: 'RegisteredStudent',
      after: { imported: records.length, skipped: errors.length },
      ip,
    });
    return {
      imported: records.length,
      skipped: errors.length,
      errors: errors.slice(0, 10),
    };
  }

  /**
   * Checks sign-up details against the official list.
   * - registry empty  -> { enforced:false } (nothing to compare with yet)
   * - details match   -> { ok:true, record } (use the official spelling)
   * - anything else   -> { ok:false }
   */
  async verify(typed: { regNo: string; name: string; course: string; year: number }) {
    const total = await this.prisma.registeredStudent.count();
    if (total === 0) return { enforced: false as const, ok: true as const, record: null };

    const record = await this.prisma.registeredStudent.findUnique({
      where: { regKey: normalizeRegNo(typed.regNo) },
    });
    if (!record || !detailsMatch(typed, record)) {
      return { enforced: true as const, ok: false as const, record: null };
    }
    return { enforced: true as const, ok: true as const, record };
  }

  /** Official Reg. No. for whatever spelling someone typed, or null. */
  async officialRegNo(typed: string): Promise<string | null> {
    const record = await this.prisma.registeredStudent.findUnique({
      where: { regKey: normalizeRegNo(typed) },
      select: { regNo: true },
    });
    return record?.regNo ?? null;
  }
}
