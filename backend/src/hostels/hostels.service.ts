import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHostelDto } from './dto/create-hostel.dto';
import { UpdateHostelDto } from './dto/update-hostel.dto';
 
@Injectable()
export class HostelsService {
  constructor(private prisma: PrismaService) {}
 
  create(dto: CreateHostelDto) {
    return this.prisma.hostel.create({ data: dto });
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
 
  async update(id: string, dto: UpdateHostelDto) {
    await this.findOne(id);
    return this.prisma.hostel.update({ where: { id }, data: dto });
  }
 
  async remove(id: string) {
    const hostel = await this.findOne(id);
    if (hostel.rooms.length > 0) {
      throw new ConflictException(
        'Huwezi kufuta hosteli yenye vyumba. Futa vyumba vyake kwanza.',
      );
    }
    return this.prisma.hostel.delete({ where: { id } });
  }
}
 