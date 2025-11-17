import { Module } from '@nestjs/common';
import { JwtCookieStrategy } from 'src/auth/strategies/jwt-cookie.strategy';

import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

@Module({
  controllers: [ConversationController],
  providers: [ConversationService, JwtCookieStrategy],
})
export class ConversationModule {}
