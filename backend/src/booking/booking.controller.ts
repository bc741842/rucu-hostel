import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StudentGuard } from '../common/guards/student.guard';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // Only returns beds in hostels matching the logged-in student's gender
  // (or a hostel open to everyone) - see BookingService.getAvailableBeds.
  @UseGuards(StudentGuard)
  @Get('available-beds')
  getAvailableBeds(@Req() req: any) {
    return this.bookingService.getAvailableBeds(req.user.studentId);
  }

  @UseGuards(StudentGuard)
  @Get('my')
  getMyBookings(@Req() req: any) {
    return this.bookingService.getMyBookings(req.user.studentId);
  }

  @UseGuards(StudentGuard)
  @Post()
  createBooking(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(req.user.studentId, dto);
  }

  @UseGuards(StudentGuard)
  @Patch(':id/cancel')
  cancelBooking(@Req() req: any, @Param('id') id: string) {
    return this.bookingService.cancelBooking(req.user.studentId, id);
  }

  // Student: get (or lazily generate) my own check-in QR code
  @UseGuards(StudentGuard)
  @Get('my/qr-code')
  getMyQrCode(@Req() req: any) {
    return this.bookingService.getMyQrCode(req.user.studentId);
  }

  // Admin/Warden: scan a QR code and check the student in
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'warden')
  @Post('checkin/:code')
  checkIn(@Param('code') code: string) {
    return this.bookingService.checkInByCode(code);
  }

  // Student: see who else is booked into my room
  @UseGuards(StudentGuard)
  @Get('my/roommates')
  getMyRoommates(@Req() req: any) {
    return this.bookingService.getMyRoommates(req.user.studentId);
  }
}
 