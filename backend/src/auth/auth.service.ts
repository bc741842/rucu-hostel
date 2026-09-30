import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
 
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
 
    return this.buildToken(student.id, student.regNo);
  }
 
  async login(dto: LoginDto) {
    const student = await this.prisma.student.findUnique({
      where: { regNo: dto.regNo },
    });
 
    if (!student) {
      throw new UnauthorizedException('Invalid Reg. No. or password');
    }
 
    const passwordMatches = await bcrypt.compare(
      dto.password,
      student.password,
    );
 
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid Reg. No. or password');
    }
 
    return this.buildToken(student.id, student.regNo);
  }
 
  private buildToken(studentId: string, regNo: string) {
    const payload = { sub: studentId, regNo };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
 