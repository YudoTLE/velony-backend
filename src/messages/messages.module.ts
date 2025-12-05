import { forwardRef, Module } from '@nestjs/common';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { UserConversationsModule } from 'src/user-conversations/user-conversations.module';
import { UsersModule } from 'src/users/users.module';

import { MessageEventsHandler } from './events/message-events.handler';
import { MessagesRepository } from './messages.repository';
import { MessagesService } from './messages.service';

@Module({
  providers: [MessagesService, MessagesRepository, MessageEventsHandler],
  imports: [
    forwardRef(() => RealtimeModule),
    forwardRef(() => ConversationsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => UserConversationsModule),
  ],
  exports: [MessagesService, MessagesRepository],
})
export class MessagesModule {}
