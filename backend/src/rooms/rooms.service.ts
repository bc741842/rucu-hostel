import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
 
@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}
 
  async create(dto: CreateRoomDto, actorId?: string, ip?: string) {
    const hostel = await this.prisma.hostel.findUnique({
      where: { id: dto.hostelId },
    });
    if (!hostel) throw new NotFoundException('Hostel not found');
 
    const room = await this.prisma.room.create({ data: dto });
 
    if (actorId) {
      await this.auditLogService.log({
        actorId,
        action: 'room.create',
        description: `Created room "${room.number}" in ${hostel.name}`,
        entityType: 'Room',
        entityId: room.id,
        after: dto,
        ip,
      });
    }
 
    return room;
  }
 
  findAll(hostelId?: string) {
    return this.prisma.room.findMany({
      where: hostelId ? { hostelId } : undefined,
      include: { hostel: true, beds: true },
    });
  }
 
  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { hostel: true, beds: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }
 
  async update(id: string, dto: UpdateRoomDto, actorId?: string, ip?: string) {
    const existing = await this.findOne(id);
    const updated = await this.prisma.room.update({ where: { id }, data: dto });
 
    if (actorId) {
      const before: Record<string, any> = {};
      const after: Record<string, any> = {};
      for (const key of Object.keys(dto)) {
        before[key] = (existing as any)[key];
        after[key] = (updated as any)[key];
      }
 
      await this.auditLogService.log({
        actorId,
        action: 'room.update',
        description: `Updated room "${existing.number}" in ${existing.hostel.name}`,
        entityType: 'Room',
        entityId: id,
        before,
        after,
        ip,
      });
    }
 
    return updated;
  }
 
  async remove(id: string, actorId?: string, ip?: string) {
    const room = await this.findOne(id);
    if (room.beds.length > 0) {
      throw new ConflictException(
        'Huwezi kufuta chumba chenye vitanda. Futa vitanda vyake kwanza.',
      );
    }
    await this.prisma.room.delete({ where: { id } });
 
    if (actorId) {
      await this.auditLogService.log({
        actorId,
        action: 'room.delete',
        description: `Deleted room "${room.number}" from ${room.hostel.name}`,
        entityType: 'Room',
        entityId: id,
        before: { number: room.number, hostelId: room.hostelId },
        ip,
      });
    }
 
    return { success: true };
  }
}
 