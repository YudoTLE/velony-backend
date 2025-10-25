import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';

import { UserDetailResponseDto } from './dto/user-detail-response.dto';
import { UserSummaryResponseDto } from './dto/user-summary-response.dto';
import { UserUpdateRequestDto } from './dto/user-update-request.dto';
import { UsersService } from './users.service';
import { JwtCookieAuthGuard } from '../auth/guards/jwt-cookie-auth.guard';

@Controller('users')
@UseGuards(JwtCookieAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async findMe(@Request() request): Promise<UserDetailResponseDto> {
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

  @Patch('me')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateMe(
    @Request() request,
    @Body() updates: UserUpdateRequestDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<UserDetailResponseDto> {
    const user = await this.usersService.update(request.user.sub, {
      ...updates,
      avatar: avatar?.buffer,
    });
    if (!user) throw new NotFoundException('User not found');
    return plainToInstance(UserDetailResponseDto, user);
  }

  @Post('me/verify-email')
  async verifyEmail(
    @Request() request,
    @Body('otp') otp: string,
  ): Promise<string> {
    return await this.usersService.verifyEmail(request.user.sub, otp);
  }
}
