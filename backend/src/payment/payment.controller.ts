import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaymentService } from './payment.service';
 
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
 
  @Get('my')
  getMyPayments(@Req() req: any) {
    return this.paymentService.getMyPayments(req.user.studentId);
  }
 
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'accountant')
  @Get()
  getAllPayments(@Query('status') status?: string) {
    return this.paymentService.getAllPayments(status);
  }
 
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'accountant')
  @Patch(':id/confirm')
  confirmPayment(@Param('id') id: string, @Req() req: any) {
    return this.paymentService.confirmPayment(id, req.user.userId);
  }
}
 