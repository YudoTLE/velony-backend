import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { UserDetailResponseDto } from './dto/user-detail-response.dto';
import { UserSummaryResponseDto } from './dto/user-summary-response.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

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
