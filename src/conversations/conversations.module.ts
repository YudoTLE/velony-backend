import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { MessagesModule } from 'src/messages/messages.module';
import { UserConversationsModule } from 'src/user-conversations/user-conversations.module';
import { UsersModule } from 'src/users/users.module';

import { ConversationsController } from './conversations.controller';
import { ConversationsRepository } from './conversations.repository';
import { ConversationsService } from './conversations.service';

@Module({
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationsRepository],
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => MessagesModule),
    forwardRef(() => UserConversationsModule),
  ],
  exports: [ConversationsService, ConversationsRepository],
})
export class ConversationsModule {}
