import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
 
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }
 
  validate(payload: any) {
    // Token za wafanyakazi (admin/accountant/warden) zina 'role' ndani ya payload.
    // Token za wanafunzi zina 'regNo' badala yake.
    if (payload.role) {
      return { userId: payload.sub, role: payload.role, name: payload.name };
    }
    return { studentId: payload.sub, regNo: payload.regNo };
  }
}
 