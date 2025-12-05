import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AuthModule } from './auth/auth.module';
import { validate } from './config/env.validation';
import { ConversationsModule } from './conversations/conversations.module';
import { DatabaseModule } from './database/database.module';
import { MailModule } from './mail/mail.module';
import { MessagesModule } from './messages/messages.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { TestModule } from './test/test.module';
import { UserConversationsModule } from './user-conversations/user-conversations.module';
import { UsersModule } from './users/users.module';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    EventEmitterModule.forRoot(),
    RedisModule,
    MailModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    StorageModule,
    VerificationModule,
    ConversationsModule,
    MessagesModule,
    RealtimeModule,
    UserConversationsModule,
    TestModule,
  ],
})
export class AppModule {}
