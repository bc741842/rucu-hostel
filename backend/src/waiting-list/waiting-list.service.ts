import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWaitingEntryDto } from './dto/create-waiting-entry.dto';
 
@Injectable()
export class WaitingListService {
  constructor(private readonly prisma: PrismaService) {}
 
  /**
   * Mwanafunzi anajiunga na foleni ya kusubiri kitanda kwenye hostel fulani,
   * endapo hakuna kitanda kilicho huru kwa sasa.
   */
  async join(studentId: string, dto: CreateWaitingEntryDto) {
    const hostel = await this.prisma.hostel.findUnique({
      where: { id: dto.hostelId },
    });
    if (!hostel) {
      throw new NotFoundException('Hostel haipo.');
    }
 
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id: dto.academicYearId },
    });
    if (!academicYear) {
      throw new NotFoundException('Mwaka wa masomo haupo.');
    }
 
    // Angalia kama kuna kitanda huru kwenye hostel hii. Kama kipo,
    // mwanafunzi anapaswa kubook moja kwa moja badala ya kuingia foleni.
    const freeBedCount = await this.prisma.bed.count({
      where: {
        room: { hostelId: dto.hostelId },
        status: 'free',
      },
    });
 
    if (freeBedCount > 0) {
      throw new ConflictException(
        'Kuna vitanda huru kwenye hostel hii. Tafadhali fanya booking moja kwa moja badala ya kuingia foleni.',
      );
    }
 
    // Angalia kama mwanafunzi tayari yupo kwenye foleni ya hostel hii.
    const existing = await this.prisma.waitingList.findFirst({
      where: {
        studentId,
        hostelId: dto.hostelId,
        academicYearId: dto.academicYearId,
        status: 'waiting',
      },
    });
 
    if (existing) {
      throw new ConflictException(
        'Tayari upo kwenye foleni ya kusubiri kitanda kwenye hostel hii.',
      );
    }
 
    return this.prisma.waitingList.create({
      data: {
        studentId,
        hostelId: dto.hostelId,
        academicYearId: dto.academicYearId,
        status: 'waiting',
      },
      include: {
        hostel: true,
        academicYear: true,
      },
    });
  }
 
  /**
   * Orodha ya foleni za mwanafunzi mwenyewe.
   */
  async getMy(studentId: string) {
    return this.prisma.waitingList.findMany({
      where: { studentId },
      include: {
        hostel: true,
        academicYear: true,
      },
      orderBy: { joinedAt: 'desc' },
    });
  }
 
  /**
   * Mwanafunzi anajitoa kwenye foleni.
   */
  async leave(studentId: string, id: string) {
    const entry = await this.prisma.waitingList.findUnique({
      where: { id },
    });
 
    if (!entry) {
      throw new NotFoundException('Taarifa ya foleni haipo.');
    }
 
    if (entry.studentId !== studentId) {
      throw new ForbiddenException('Huwezi kubadilisha foleni ya mtu mwingine.');
    }
 
    if (entry.status !== 'waiting') {
      throw new ConflictException(
        'Hauwezi kujitoa kwenye foleni hii kwa sasa (tayari imebadilika hali).',
      );
    }
 
    return this.prisma.waitingList.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }
 
  /**
   * Admin/Warden: orodha kamili ya foleni (FIFO), ikiwa na taarifa za
   * mawasiliano za mwanafunzi kwa ajili ya kumfikia moja kwa moja.
   * Inaweza kuchujwa kwa hostelId.
   */
  async getQueue(hostelId?: string) {
    return this.prisma.waitingList.findMany({
      where: {
        status: 'waiting',
        ...(hostelId ? { hostelId } : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            regNo: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        hostel: true,
        academicYear: true,
      },
      orderBy: { joinedAt: 'asc' },
    });
  }
}
 