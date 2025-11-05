import { Module } from '@nestjs/common';
import { JwtCookieStrategy } from 'src/auth/strategies/jwt-cookie.strategy';
import { UsersService } from 'src/users/users.service';

import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';

@Module({
  controllers: [OtpController],
  providers: [OtpService, UsersService, JwtCookieStrategy],
})
export class OtpModule {}
