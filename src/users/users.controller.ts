import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import { UserDetailResponseDto } from './dto/user-detail-response.dto';
import { UserSummaryResponseDto } from './dto/user-summary-response.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(): Promise<UserSummaryResponseDto[]> {
    return this.usersService.findAll();
  }

  @Get(':uuid')
  async findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<UserDetailResponseDto> {
    return this.usersService.findByUuid(uuid);
  }
}
