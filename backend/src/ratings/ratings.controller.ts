import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StudentGuard } from '../common/guards/student.guard';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';

@UseGuards(JwtAuthGuard)
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  // Student: rate (or update my rating for) my current hostel
  @UseGuards(StudentGuard)
  @Post()
  rateMyHostel(@Req() req: any, @Body() dto: CreateRatingDto) {
    return this.ratingsService.rateMyHostel(req.user.studentId, dto);
  }

  // Student: see my current rating, if any
  @UseGuards(StudentGuard)
  @Get('my')
  getMyRating(@Req() req: any) {
    return this.ratingsService.getMyRating(req.user.studentId);
  }
 
  // Admin/Warden/Accountant: average rating per hostel + individual comments
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'warden', 'accountant')
  @Get('admin')
  getAdminSummary(
    @Query('hostelId') hostelId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.ratingsService.getAdminSummary(hostelId, academicYearId);
  }
}
 