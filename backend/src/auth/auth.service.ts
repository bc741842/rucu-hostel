import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
 
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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
 
    if (!student) {
      throw new NotFoundException('Student not found');
    }
 
    const contact = student.phone || student.email;
    if (!contact) {
      throw new BadRequestException(
        'No phone number or email is on file for this account. Contact the administrator.',
      );
    }
 
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
 
    const otpSession = this.jwtService.sign(
      { sub: student.id, otpHash, purpose: 'otp_verify' },
      { expiresIn: '10m' },
    );
 
    // TODO: Hapa ndipo pa kuunganisha huduma HALISI ya SMS/Email.
    console.log(
      `[OTP - MAJARIBIO] Reg No: ${student.regNo} | Contact: ${contact} | OTP: ${otp}`,
    );
 
    const maskedContact = this.maskContact(contact);
 
    return {
      otpSession,
      maskedContact,
      devOtp: otp, // ONDOA mara huduma halisi ikiwa tayari
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
 