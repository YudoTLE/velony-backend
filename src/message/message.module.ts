import { Module } from '@nestjs/common';
import { ConversationService } from 'src/conversation/conversation.service';

import { MessageGateway } from './message.gateway';
import { MessageService } from './message.service';

@Module({
  providers: [MessageService, MessageGateway, ConversationService],
})
export class MessageModule {}
