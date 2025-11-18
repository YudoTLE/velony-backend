import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { validate } from './config/env.validation';
import { ConversationModule } from './conversation/conversation.module';
import { DatabaseModule } from './database/database.module';
import { MailModule } from './mail/mail.module';
import { MessageModule } from './message/message.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { UserModule } from './user/user.module';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    RedisModule,
    MailModule,
    DatabaseModule,
    UserModule,
    AuthModule,
    StorageModule,
    VerificationModule,
    ConversationModule,
    MessageModule,
  ],
})
export class AppModule {}
