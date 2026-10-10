import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StudentGuard } from '../common/guards/student.guard';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { announcementMulterOptions } from './multer.config';

@UseGuards(JwtAuthGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  // Student: announcements relevant to me (general + my hostel's)
  @UseGuards(StudentGuard)
  @Get('my')
  getMy(@Req() req: any) {
    return this.announcementsService.findForStudent(req.user.studentId);
  }
 
  // Admin/Warden/Accountant: full list for management
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'warden', 'accountant')
  @Get()
  getAll() {
    return this.announcementsService.findAll();
  }
 
  // Admin/Warden/Accountant: create a new announcement, with an optional
  // PDF attached (field name "file" in the multipart form).
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'warden', 'accountant')
  @Post()
  @UseInterceptors(FileInterceptor('file', announcementMulterOptions))
  create(
    @Req() req: any,
    @Body() dto: CreateAnnouncementDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.announcementsService.create(
      req.user.userId,
      dto,
      file,
      req.ip,
    );
  }
 
  // Anyone logged in: download the PDF attached to an announcement. The
  // file itself lives on Cloudinary (filePath is its secure URL) - this
  // route fetches it server-side and streams it back with a "force
  // download" header, so the browser's download request is never blocked
  // by CORS.
  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const announcement = await this.announcementsService.findOne(id);
    if (!announcement.filePath || !announcement.fileName) {
      throw new NotFoundException('This announcement has no attached document.');
    }
 
    const fileRes = await fetch(announcement.filePath);
    if (!fileRes.ok) {
      throw new NotFoundException('File is missing from storage.');
    }
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(announcement.fileName)}"`,
    );
    return res.send(buffer);
  }
 
  // Admin/Warden: delete an announcement
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'warden')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.announcementsService.remove(id, req.user.userId, req.ip);
  }
}
 