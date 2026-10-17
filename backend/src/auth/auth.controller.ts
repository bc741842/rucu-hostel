import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { StudentGuard } from '../common/guards/student.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
 
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
 
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
 
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
 
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }
 
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }
 
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // Student: change my own password
  @UseGuards(JwtAuthGuard, StudentGuard)
  @Post('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.studentId, dto);
  }
}
