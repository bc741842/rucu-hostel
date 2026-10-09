import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateHostelDto } from './dto/create-hostel.dto';
import { UpdateHostelDto } from './dto/update-hostel.dto';
 
@Injectable()
export class HostelsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}
 
  async create(dto: CreateHostelDto, actorId?: string, ip?: string) {
    const hostel = await this.prisma.hostel.create({ data: dto });
 
    if (actorId) {
      await this.auditLogService.log({
        actorId,
        action: 'hostel.create',
        description: `Created hostel "${hostel.name}"`,
        entityType: 'Hostel',
        entityId: hostel.id,
        after: dto,
        ip,
      });
    }
 
    return hostel;
  }
 
  findAll() {
    return this.prisma.hostel.findMany({
      include: { rooms: { select: { id: true } } },
    });
  }
 
  async findOne(id: string) {
    const hostel = await this.prisma.hostel.findUnique({
      where: { id },
      include: { rooms: { include: { beds: true } } },
    });
    if (!hostel) throw new NotFoundException('Hostel not found');
    return hostel;
  }
 
  async update(
    id: string,
    dto: UpdateHostelDto,
    actorId?: string,
    ip?: string,
  ) {
    const existing = await this.findOne(id);
    const updated = await this.prisma.hostel.update({ where: { id }, data: dto });
 
    if (actorId) {
      // Only log the fields that were actually part of this update.
      const before: Record<string, any> = {};
      const after: Record<string, any> = {};
      for (const key of Object.keys(dto)) {
        before[key] = (existing as any)[key];
        after[key] = (updated as any)[key];
      }
 
      await this.auditLogService.log({
        actorId,
        action: 'hostel.update',
        description: `Updated hostel "${existing.name}"`,
        entityType: 'Hostel',
        entityId: id,
        before,
        after,
        ip,
      });
    }
 
    return updated;
  }
 
  async remove(id: string, actorId?: string, ip?: string) {
    const hostel = await this.findOne(id);
    if (hostel.rooms.length > 0) {
      throw new ConflictException(
        'Huwezi kufuta hosteli yenye vyumba. Futa vyumba vyake kwanza.',
      );
    }
    await this.prisma.hostel.delete({ where: { id } });
 
    if (actorId) {
      await this.auditLogService.log({
        actorId,
        action: 'hostel.delete',
        description: `Deleted hostel "${hostel.name}"`,
        entityType: 'Hostel',
        entityId: id,
        before: { name: hostel.name },
        ip,
      });
    }
 
    return { success: true };
  }
}
 