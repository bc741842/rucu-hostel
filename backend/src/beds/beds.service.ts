import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';
 
@Injectable()
export class BedsService {
  constructor(private prisma: PrismaService) {}
 
  async create(dto: CreateBedDto) {
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
    });
    if (!room) throw new NotFoundException('Room not found');
 
    return this.prisma.bed.create({ data: dto });
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
 
  async update(id: string, dto: UpdateBedDto) {
    await this.findOne(id);
    return this.prisma.bed.update({ where: { id }, data: dto });
  }
 
  async remove(id: string) {
    const bed = await this.findOne(id);
    const activeBooking = bed.bookings.find((b) =>
      ['Pending', 'Paid', 'Confirmed', 'CheckedIn'].includes(b.status),
    );
    if (activeBooking) {
      throw new ConflictException(
        'Huwezi kufuta kitanda chenye booking hai.',
      );
    }
    return this.prisma.bed.delete({ where: { id } });
  }
}
 