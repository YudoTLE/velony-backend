import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';

import { VerificationRepository } from './verification.repository';
import { VerificationService } from './verification.service';

@Module({
  providers: [VerificationService, VerificationRepository],
  imports: [forwardRef(() => AuthModule), forwardRef(() => UsersModule)],
  exports: [VerificationService],
})
export class VerificationModule {}
