import { Module } from '@nestjs/common';
import { JwtCookieStrategy } from 'src/auth/strategies/jwt-cookie.strategy';

import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

@Module({
  controllers: [ConversationsController],
  providers: [ConversationsService, JwtCookieStrategy],
})
export class ConversationsModule {}
