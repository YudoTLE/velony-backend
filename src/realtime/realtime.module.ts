import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MessagesModule } from 'src/messages/messages.module';

import { RealtimeGateway } from './realtime.gateway';

@Module({
  providers: [RealtimeGateway],
  imports: [forwardRef(() => MessagesModule), JwtModule],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
