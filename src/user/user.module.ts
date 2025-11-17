import { Module } from '@nestjs/common';
import { JwtCookieStrategy } from 'src/auth/strategies/jwt-cookie.strategy';
import { VerificationService } from 'src/verification/verification.service';

import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, VerificationService, JwtCookieStrategy],
})
export class UserModule {}
