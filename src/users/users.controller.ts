import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';

import { CreateUserWithUsernameRequestDto } from './dto/create-user-with-username-request.dto';
import { UserDetailResponseDto } from './dto/user-detail-response.dto';
import { UserSummaryResponseDto } from './dto/user-summary-response.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('username')
  @HttpCode(HttpStatus.CREATED)
  async createUserWithUsername(
    @Body() createUserDto: CreateUserWithUsernameRequestDto,
  ): Promise<UserDetailResponseDto> {
    return this.usersService.createUserWithUsername(createUserDto);
  }

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
