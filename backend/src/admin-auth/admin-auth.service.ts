import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
 
@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}
 
  async login(dto: AdminLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
 
    if (!user) {
      throw new UnauthorizedException('Username au password si sahihi');
    }
 
    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Username au password si sahihi');
    }
 
    const accessToken = this.jwtService.sign({
      sub: user.id,
      role: user.role,
      name: user.name,
    });
 
    return { accessToken, role: user.role, name: user.name };
  }
}
 