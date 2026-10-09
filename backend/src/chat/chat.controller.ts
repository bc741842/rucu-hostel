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
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { chatMulterOptions } from './multer.config';
 
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
 
  // Student: my own hostel's group chat
  @Get('hostel')
  getMyHostelChat(@Req() req: any) {
    return this.chatService.getHostelMessages(req.user.studentId);
  }
 
  // Field name "file" in the multipart form - optional (image/audio/video).
  @Post('hostel')
  @UseInterceptors(FileInterceptor('file', chatMulterOptions))
  sendToMyHostel(
    @Req() req: any,
    @Body() dto: SendMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.chatService.sendHostelMessage(req.user.studentId, dto, file);
  }
 
  // Everyone: the global "All Hostels" group chat
  @Get('all')
  getAllHostelsChat() {
    return this.chatService.getAllHostelsMessages();
  }
 
  @Post('all')
  @UseInterceptors(FileInterceptor('file', chatMulterOptions))
  sendToAllHostels(
    @Req() req: any,
    @Body() dto: SendMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.chatService.sendAllHostelsMessage(req.user.studentId, dto, file);
  }
 
  // Admin/Warden/Accountant: read-only view of a specific hostel's group chat
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'warden', 'accountant')
  @Get('admin/hostel/:hostelId')
  getHostelChatAdmin(@Param('hostelId') hostelId: string) {
    return this.chatService.getHostelMessagesAdmin(hostelId);
  }
 
  // Admin/Warden/Accountant: read-only view of the "All Hostels" group chat
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'warden', 'accountant')
  @Get('admin/all')
  getAllHostelsChatAdmin() {
    return this.chatService.getAllHostelsMessages();
  }
 
  // Everyone (student or admin/warden/accountant): download the file
  // attached to a message, with its original file name. The file itself
  // lives on Cloudinary (filePath is its secure URL) - this route fetches
  // it server-side and streams it back with a "force download" header, so
  // the browser's download request is never blocked by CORS.
  @Get(':id/download')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const message = await this.chatService.getMessageForDownload(id);
    const fileRes = await fetch(message.filePath!);
    if (!fileRes.ok) {
      throw new NotFoundException('File is missing from storage.');
    }
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    res.setHeader(
      'Content-Type',
      message.mimeType || 'application/octet-stream',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(message.fileName!)}"`,
    );
    return res.send(buffer);
  }
 
  // Admin/Warden: delete a message from any group (moderation)
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'warden')
  @Delete('admin/:id')
  deleteMessage(@Param('id') id: string) {
    return this.chatService.deleteMessage(id);
  }
}
 