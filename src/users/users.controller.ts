import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { UserDetailResponseDto } from './dto/user-detail-response.dto';
import { UserSummaryResponseDto } from './dto/user-summary-response.dto';
import { UsersService } from './users.service';
import { JwtCookieAuthGuard } from '../auth/guards/jwt-cookie-auth.guard';

@Controller('users')
@UseGuards(JwtCookieAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async me(@Request() request): Promise<UserDetailResponseDto> {
    const user = await this.usersService.findByUuid(request.user.sub);
    return plainToInstance(UserDetailResponseDto, user);
  }

  @Get()
  async findAll(): Promise<UserSummaryResponseDto[]> {
    const users = await this.usersService.findAll();
    return plainToInstance(UserSummaryResponseDto, users);
  }

  @Get(':uuid')
  async findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<UserDetailResponseDto> {
    const user = await this.usersService.findByUuid(uuid);
    if (!user) throw new NotFoundException('User not found');
    return plainToInstance(UserDetailResponseDto, user);
  }
}
