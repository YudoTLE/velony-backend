import { Module } from '@nestjs/common';
import { JwtCookieStrategy } from 'src/auth/strategies/jwt-cookie.strategy';
import { MessageGateway } from 'src/message/message.gateway';
import { MessageService } from 'src/message/message.service';

import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

@Module({
  controllers: [ConversationController],
  providers: [
    ConversationService,
    MessageService,
    MessageGateway,
    JwtCookieStrategy,
  ],
  exports: [ConversationService],
})
export class ConversationModule {}
