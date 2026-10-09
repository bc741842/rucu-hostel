import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { resolveMessageType } from './multer.config';
 
const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  'Pending',
  'Paid',
  'Confirmed',
  'CheckedIn',
];
 
const messageInclude = {
  student: { select: { id: true, name: true, regNo: true } },
};
 
@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}
 
  // Finds the hostel a student is currently a "member" of, based on
  // their most recent active booking. Returns null if they have none.
  private async getStudentHostelId(studentId: string): Promise<string | null> {
    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        studentId,
        status: { in: ACTIVE_BOOKING_STATUSES },
      },
      include: { bed: { include: { room: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return activeBooking?.bed.room.hostelId ?? null;
  }
 
  private buildMessageData(
    dto: SendMessageDto,
    file?: Express.Multer.File,
  ) {
    const hasText = !!dto.message?.trim();
    const hasFile = !!file;
 
    if (!hasText && !hasFile) {
      throw new BadRequestException(
        'Send some text, or attach an image, audio or video.',
      );
    }
 
    return {
      message: hasText ? dto.message!.trim() : null,
      messageType: file ? resolveMessageType(file.mimetype) : 'text',
      fileName: file ? file.originalname : null,
      filePath: file ? file.path : null,
      fileSize: file ? file.size : null,
      mimeType: file ? file.mimetype : null,
    };
  }
 
  // Student: read my own hostel's group chat
  async getHostelMessages(studentId: string) {
    const hostelId = await this.getStudentHostelId(studentId);
    if (!hostelId) {
      throw new ConflictException(
        'You need an active bed booking to join a hostel chat group.',
      );
    }
    return this.prisma.chatMessage.findMany({
      where: { hostelId },
      include: messageInclude,
      orderBy: { createdAt: 'asc' },
    });
  }
 
  // Student: send a message (text and/or media) to my own hostel's group chat
  async sendHostelMessage(
    studentId: string,
    dto: SendMessageDto,
    file?: Express.Multer.File,
  ) {
    const hostelId = await this.getStudentHostelId(studentId);
    if (!hostelId) {
      throw new ConflictException(
        'You need an active bed booking to join a hostel chat group.',
      );
    }
    return this.prisma.chatMessage.create({
      data: {
        hostelId,
        studentId,
        ...this.buildMessageData(dto, file),
      },
      include: messageInclude,
    });
  }
 
  // Everyone: read the global "All Hostels" group chat
  async getAllHostelsMessages() {
    return this.prisma.chatMessage.findMany({
      where: { hostelId: null },
      include: messageInclude,
      orderBy: { createdAt: 'asc' },
    });
  }
 
  // Student: send a message (text and/or media) to the global "All Hostels"
  // group chat
  async sendAllHostelsMessage(
    studentId: string,
    dto: SendMessageDto,
    file?: Express.Multer.File,
  ) {
    return this.prisma.chatMessage.create({
      data: {
        hostelId: null,
        studentId,
        ...this.buildMessageData(dto, file),
      },
      include: messageInclude,
    });
  }
 
  // Admin/Warden/Accountant: read-only view of one hostel's group chat
  async getHostelMessagesAdmin(hostelId: string) {
    const hostel = await this.prisma.hostel.findUnique({ where: { id: hostelId } });
    if (!hostel) {
      throw new NotFoundException('Hostel not found.');
    }
    return this.prisma.chatMessage.findMany({
      where: { hostelId },
      include: messageInclude,
      orderBy: { createdAt: 'asc' },
    });
  }
 
  // Everyone: look up a message's attached file to serve as a download.
  async getMessageForDownload(id: string) {
    const message = await this.prisma.chatMessage.findUnique({ where: { id } });
    if (!message) {
      throw new NotFoundException('Message not found.');
    }
    if (!message.filePath || !message.fileName) {
      throw new NotFoundException('This message has no attached file.');
    }
    return message;
  }
 
  // Admin/Warden: delete a message from any group (moderation)
  async deleteMessage(id: string) {
    const message = await this.prisma.chatMessage.findUnique({ where: { id } });
    if (!message) {
      throw new NotFoundException('Message not found.');
    }
    await this.prisma.chatMessage.delete({ where: { id } });
    return { success: true };
  }
}
 