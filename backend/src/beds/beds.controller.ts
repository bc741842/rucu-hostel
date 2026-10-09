import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BedsService } from './beds.service';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';
 
@UseGuards(JwtAuthGuard)
@Controller('beds')
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}
 
  @Get()
  findAll(@Query('roomId') roomId?: string) {
    return this.bedsService.findAll(roomId);
  }
 
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bedsService.findOne(id);
  }
 
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @Post()
  create(@Req() req: any, @Body() dto: CreateBedDto) {
    return this.bedsService.create(dto, req.user.userId, req.ip);
  }
 
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'warden')
  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBedDto) {
    return this.bedsService.update(id, dto, req.user.userId, req.ip);
  }
 
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.bedsService.remove(id, req.user.userId, req.ip);
  }
}
 