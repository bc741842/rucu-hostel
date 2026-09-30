import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
 
@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}
 
  async create(dto: CreateRoomDto) {
    const hostel = await this.prisma.hostel.findUnique({
      where: { id: dto.hostelId },
    });
    if (!hostel) throw new NotFoundException('Hostel not found');
 
    return this.prisma.room.create({ data: dto });
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
 
  async update(id: string, dto: UpdateRoomDto) {
    await this.findOne(id);
    return this.prisma.room.update({ where: { id }, data: dto });
  }
 
  async remove(id: string) {
    const room = await this.findOne(id);
    if (room.beds.length > 0) {
      throw new ConflictException(
        'Huwezi kufuta chumba chenye vitanda. Futa vitanda vyake kwanza.',
      );
    }
    return this.prisma.room.delete({ where: { id } });
  }
}
 