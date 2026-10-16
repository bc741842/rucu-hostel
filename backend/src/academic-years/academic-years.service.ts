import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
 
@Injectable()
export class AcademicYearsService {
  constructor(private prisma: PrismaService) {}
 
  findAll() {
    return this.prisma.academicYear.findMany({
      orderBy: { startsAt: 'desc' },
    });
  }

  async create(dto: CreateAcademicYearDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt) {
      throw new BadRequestException('End date must be after the start date.');
    }
    const exists = await this.prisma.academicYear.findUnique({
      where: { name: dto.name },
    });
    if (exists) {
      throw new ConflictException(`Academic year ${dto.name} already exists.`);
    }
    return this.prisma.academicYear.create({
      data: { name: dto.name, startsAt, endsAt, status: 'active' },
    });
  }
}
