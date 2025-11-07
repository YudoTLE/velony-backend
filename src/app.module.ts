import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { validate } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { MailModule } from './mail/mail.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
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
    UsersModule,
    AuthModule,
    StorageModule,
    VerificationModule,
  ],
  providers: [VerificationService],
})
export class AppModule {}
