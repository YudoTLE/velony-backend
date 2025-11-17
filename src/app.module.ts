import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { validate } from './config/env.validation';
import { ConversationModule } from './conversations/conversation.module';
import { ConversationService } from './conversations/conversation.service';
import { DatabaseModule } from './database/database.module';
import { MailModule } from './mail/mail.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { UserModule } from './users/user.module';
import { VerificationModule } from './verification/verification.module';
import { VerificationService } from './verification/verification.service';

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
  ],
  providers: [VerificationService, ConversationService],
})
export class AppModule {}
