import { Controller, UseGuards, Request, Body, Post } from '@nestjs/common';
import { JwtCookieAuthGuard } from 'src/auth/guards/jwt-cookie-auth.guard';

import { OtpService } from './otp.service';

@Controller('otp')
@UseGuards(JwtCookieAuthGuard)
export class OtpController {
  constructor(private otpService: OtpService) {}

  @Post('email/send')
  async sendEmail(
    @Request() request,
    @Body('email') email: string,
  ): Promise<void> {
    await this.otpService.sendEmail(request.user.sub, email);
  }

  @Post('email/verify')
  async verifyEmail(
    @Request() request,
    @Body('otp') otp: string,
  ): Promise<string> {
    return await this.otpService.verifyEmail(request.user.sub, otp);
  }
}
