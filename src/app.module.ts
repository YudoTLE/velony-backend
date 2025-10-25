import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { validate } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { MailModule } from './mail/mail.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';

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
  ],
})
export class AppModule {}
