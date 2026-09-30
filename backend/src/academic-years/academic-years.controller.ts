import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AcademicYearsService } from './academic-years.service';
 
@UseGuards(JwtAuthGuard)
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}
 
  @Get()
  findAll() {
    return this.academicYearsService.findAll();
  }
}