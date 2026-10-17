import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
 
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {}
 
  async register(dto: RegisterDto) {
    const existing = await this.prisma.student.findUnique({
      where: { regNo: dto.regNo },
    });
 
    if (existing) {
      throw new ConflictException('Reg. No. already registered');
    }
 
    const hashedPassword = await bcrypt.hash(dto.password, 10);
 
    const student = await this.prisma.student.create({
      data: {
        regNo: dto.regNo,
        name: dto.name,
        gender: dto.gender,
        course: dto.course,
        year: dto.year,
        phone: dto.phone,
        email: dto.email,
        password: hashedPassword,
      },
    });
 
    // Welcome notification — in-app (visible as soon as they log in, which
    // happens immediately below) and by email, if they gave one.
    await this.notificationsService.create(
      student.id,
      'Welcome to RUCU Hostel Booking',
      `Hi ${student.name}, your account (Reg No: ${student.regNo}) has been created successfully. You can now browse hostels and book a bed.`,
      '/dashboard',
    );
 
    return {
      ...this.buildStudentToken(student.id, student.regNo),
      type: 'student' as const,
    };
  }
 
  // LOGIN MOJA KWA WOTE: hujaribu kwanza kama ni mwanafunzi (RegNo),
  // kisha kama si hivyo, hujaribu kama ni admin/accountant/warden (username).
  async login(dto: LoginDto) {
    const student = await this.prisma.student.findUnique({
      where: { regNo: dto.identifier },
    });
 
    if (student) {
      const passwordMatches = await bcrypt.compare(
        dto.password,
        student.password,
      );
      if (!passwordMatches) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return {
        ...this.buildStudentToken(student.id, student.regNo),
        type: 'student' as const,
      };
    }
 
    const user = await this.prisma.user.findUnique({
      where: { username: dto.identifier },
    });
 
    if (user) {
      const passwordMatches = await bcrypt.compare(
        dto.password,
        user.password,
      );
      if (!passwordMatches) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return {
        accessToken: this.jwtService.sign({
          sub: user.id,
          role: user.role,
          name: user.name,
        }),
        type: 'admin' as const,
        role: user.role,
        name: user.name,
      };
    }
 
    // Hakuna aliyepatikana - ujumbe wa jumla kwa usalama (usiseme ni upi
    // kati ya regNo/username uliokosewa, usisaidie mtu ku-"guess" akaunti).
    throw new UnauthorizedException('Invalid credentials');
  }
 
  async forgotPassword(dto: ForgotPasswordDto) {
    const student = await this.prisma.student.findUnique({
      where: { regNo: dto.regNo },
    });

    // Same response whether or not the account exists / has an email, so the
    // endpoint can't be used to discover valid registration numbers. The OTP
    // is only ever delivered by email, never returned in the response.
    const otp = randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    const otpSession = this.jwtService.sign(
      { sub: student?.id ?? 'none', otpHash, purpose: 'otp_verify' },
      { expiresIn: '10m' },
    );

    if (student?.email) {
      // Not awaited: the response must not depend on (or reveal the speed of)
      // the mail server. sendMail never throws.
      void this.emailService.sendMail(
        student.email,
        'Your RUCU Hostel password reset code',
        `Hi ${student.name},\n\nYour one-time password (OTP) reset code is: ${otp}\n\nThis code expires in 10 minutes. If you did not request this, ignore this email.`,
      );
    }

    return {
      otpSession,
      maskedContact: student?.email
        ? this.maskContact(student.email)
        : 'your registered email',
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.otpSession);
    } catch {
      throw new UnauthorizedException(
        'This OTP session has expired. Please request a new OTP.',
      );
    }
 
    if (payload.purpose !== 'otp_verify') {
      throw new UnauthorizedException('Invalid OTP session');
    }
 
    if (payload.sub === 'none') {
      throw new UnauthorizedException('Incorrect OTP. Please try again.');
    }

    const otpMatches = await bcrypt.compare(dto.otp, payload.otpHash);
    if (!otpMatches) {
      throw new UnauthorizedException('Incorrect OTP. Please try again.');
    }
 
    const resetToken = this.jwtService.sign(
      { sub: payload.sub, purpose: 'password_reset' },
      { expiresIn: '15m' },
    );
 
    return { resetToken };
  }
 
  async resetPassword(dto: ResetPasswordDto) {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.resetToken);
    } catch {
      throw new UnauthorizedException(
        'This reset link is invalid or has expired. Please request a new one.',
      );
    }
 
    if (payload.purpose !== 'password_reset') {
      throw new UnauthorizedException('Invalid reset token');
    }
 
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
 
    await this.prisma.student.update({
      where: { id: payload.sub },
      data: { password: hashedPassword },
    });
 
    return { message: 'Password reset successful. You can now log in.' };
  }
 
  /** A logged-in student changes their own password. */
  async changePassword(studentId: string, dto: ChangePasswordDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found.');

    const ok = await bcrypt.compare(dto.currentPassword, student.password);
    if (!ok) throw new UnauthorizedException('Your current password is wrong.');
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'The new password must be different from the current one.',
      );
    }

    await this.prisma.student.update({
      where: { id: studentId },
      data: { password: await bcrypt.hash(dto.newPassword, 10) },
    });
    return { message: 'Password changed successfully.' };
  }

  private maskContact(contact: string): string {
    if (contact.includes('@')) {
      const [name, domain] = contact.split('@');
      const visible = name.slice(0, 2);
      return `${visible}${'*'.repeat(Math.max(name.length - 2, 2))}@${domain}`;
    }
    return contact.replace(/(\d{3})\d+(\d{2})/, '$1*****$2');
  }
 
  private buildStudentToken(studentId: string, regNo: string) {
    const payload = { sub: studentId, regNo };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
 