import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { UserConversationsModule } from 'src/user-conversations/user-conversations.module';
import { VerificationModule } from 'src/verification/verification.module';

import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  imports: [
    forwardRef(() => ConversationsModule),
    forwardRef(() => UserConversationsModule),
    forwardRef(() => AuthModule),
    forwardRef(() => VerificationModule),
  ],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
