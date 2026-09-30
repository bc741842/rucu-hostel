import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
 
@Injectable()
export class AcademicYearsService {
  constructor(private prisma: PrismaService) {}
 
  findAll() {
    return this.prisma.academicYear.findMany({
      orderBy: { startsAt: 'desc' },
    });
  }
}
 