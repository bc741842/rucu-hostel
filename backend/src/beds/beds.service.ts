import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';
 
@Injectable()
export class BedsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}
 
  async create(dto: CreateBedDto, actorId?: string, ip?: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
    });
    if (!room) throw new NotFoundException('Room not found');
 
    const bed = await this.prisma.bed.create({ data: dto });
 
    if (actorId) {
      await this.auditLogService.log({
        actorId,
        action: 'bed.create',
        description: `Created bed "${bed.number}" in room "${room.number}"`,
        entityType: 'Bed',
        entityId: bed.id,
        after: dto,
        ip,
      });
    }
 
    return bed;
  }
 
  findAll(roomId?: string) {
    return this.prisma.bed.findMany({
      where: roomId ? { roomId } : undefined,
      include: { room: { include: { hostel: true } } },
    });
  }
 
  async findOne(id: string) {
    const bed = await this.prisma.bed.findUnique({
      where: { id },
      include: { room: { include: { hostel: true } }, bookings: true },
    });
    if (!bed) throw new NotFoundException('Bed not found');
    return bed;
  }
 
  async update(id: string, dto: UpdateBedDto, actorId?: string, ip?: string) {
    const existing = await this.findOne(id);
    const updated = await this.prisma.bed.update({ where: { id }, data: dto });
 
    if (actorId) {
      const before: Record<string, any> = {};
      const after: Record<string, any> = {};
      for (const key of Object.keys(dto)) {
        before[key] = (existing as any)[key];
        after[key] = (updated as any)[key];
      }
 
      await this.auditLogService.log({
        actorId,
        action: 'bed.update',
        description: `Updated bed "${existing.number}" in room "${existing.room.number}"`,
        entityType: 'Bed',
        entityId: id,
        before,
        after,
        ip,
      });
    }
 
    return updated;
  }
 
  async remove(id: string, actorId?: string, ip?: string) {
    const bed = await this.findOne(id);
    const activeBooking = bed.bookings.find((b) =>
      ['Pending', 'Paid', 'Confirmed', 'CheckedIn'].includes(b.status),
    );
    if (activeBooking) {
      throw new ConflictException(
        'Huwezi kufuta kitanda chenye booking hai.',
      );
    }
    await this.prisma.bed.delete({ where: { id } });
 
    if (actorId) {
      await this.auditLogService.log({
        actorId,
        action: 'bed.delete',
        description: `Deleted bed "${bed.number}" from room "${bed.room.number}"`,
        entityType: 'Bed',
        entityId: id,
        before: { number: bed.number, roomId: bed.roomId },
        ip,
      });
    }
 
    return { success: true };
  }
}
 