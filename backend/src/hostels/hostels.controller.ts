import {
  Body,
  Controller,
  Delete,
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
import { HostelsService } from './hostels.service';
import { CreateHostelDto } from './dto/create-hostel.dto';
import { UpdateHostelDto } from './dto/update-hostel.dto';
 
@UseGuards(JwtAuthGuard)
@Controller('hostels')
export class HostelsController {
  constructor(private readonly hostelsService: HostelsService) {}
 
  @Get()
  findAll() {
    return this.hostelsService.findAll();
  }
 
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hostelsService.findOne(id);
  }
 
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @Post()
  create(@Req() req: any, @Body() dto: CreateHostelDto) {
    return this.hostelsService.create(dto, req.user.userId, req.ip);
  }
 
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateHostelDto,
  ) {
    return this.hostelsService.update(id, dto, req.user.userId, req.ip);
  }
 
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.hostelsService.remove(id, req.user.userId, req.ip);
  }
}
 