import { Module } from '@nestjs/common';
import { JwtCookieStrategy } from 'src/auth/strategies/jwt-cookie.strategy';
import { VerificationService } from 'src/verification/verification.service';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, VerificationService, JwtCookieStrategy],
})
export class UsersModule {}
