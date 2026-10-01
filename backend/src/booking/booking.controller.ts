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
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
 
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}
 
  @Get('available-beds')
  getAvailableBeds() {
    return this.bookingService.getAvailableBeds();
  }
 
  @Get('my')
  getMyBookings(@Req() req: any) {
    return this.bookingService.getMyBookings(req.user.studentId);
  }
 
  @Post()
  createBooking(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(req.user.studentId, dto);
  }
 
  @Patch(':id/cancel')
  cancelBooking(@Req() req: any, @Param('id') id: string) {
    return this.bookingService.cancelBooking(req.user.studentId, id);
  }
}
 