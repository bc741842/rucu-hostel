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
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
 
@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}
 
  @Get()
  findAll(@Query('hostelId') hostelId?: string) {
    return this.roomsService.findAll(hostelId);
  }
 
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }
 
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @Post()
  create(@Req() req: any, @Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto, req.user.userId, req.ip);
  }
 
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, dto, req.user.userId, req.ip);
  }
 
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.roomsService.remove(id, req.user.userId, req.ip);
  }
}
 