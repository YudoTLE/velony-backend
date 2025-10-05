import { Module } from '@nestjs/common';
import { JwtCookieStrategy } from 'src/auth/strategies/jwt-cookie.strategy';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, JwtCookieStrategy],
})
export class UsersModule {}
