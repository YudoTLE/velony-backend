import { Module } from '@nestjs/common';
import { JwtCookieStrategy } from 'src/auth/strategies/jwt-cookie.strategy';

import { VerificationService } from './verification.service';

@Module({
  providers: [VerificationService, JwtCookieStrategy],
})
export class VerificationModule {}
