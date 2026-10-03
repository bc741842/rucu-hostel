import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { WaitingListService } from './waiting-list.service';
import { CreateWaitingEntryDto } from './dto/create-waiting-entry.dto';
 
@UseGuards(JwtAuthGuard)
@Controller('waiting-list')
export class WaitingListController {
  constructor(private readonly waitingListService: WaitingListService) {}
 
  // Mwanafunzi: jiunge na foleni ya kusubiri kitanda
  @Post()
  join(@Req() req: any, @Body() dto: CreateWaitingEntryDto) {
    return this.waitingListService.join(req.user.id, dto);
  }
 
  // Mwanafunzi: orodha ya foleni zangu
  @Get('my')
  getMy(@Req() req: any) {
    return this.waitingListService.getMy(req.user.id);
  }
 
  // Mwanafunzi: jitoe kwenye foleni
  @Patch(':id/leave')
  leave(@Req() req: any, @Param('id') id: string) {
    return this.waitingListService.leave(req.user.id, id);
  }
 
  // Admin / Warden: orodha kamili ya foleni (FIFO), inaweza kuchujwa na ?hostelId=
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'warden')
  @Get()
  getQueue(@Query('hostelId') hostelId?: string) {
    return this.waitingListService.getQueue(hostelId);
  }
}
 