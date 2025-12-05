import { Module } from '@nestjs/common';

import { UserConversationsRepository } from './user-conversations.repository';

@Module({
  providers: [UserConversationsRepository],
  exports: [UserConversationsRepository],
})
export class UserConversationsModule {}
