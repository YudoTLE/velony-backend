import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { VerificationService } from 'src/verification/verification.service';

import { UpdateUserAvatarResponseDto } from './dto/update-user-avatar-response.dto';
import { UpdateUserEmailConfirmRequestDto } from './dto/update-user-email-confirm-request.dto';
import { UpdateUserEmailConfirmResponseDto } from './dto/update-user-email-confirm-response.dto';
import { UpdateUserEmailStartRequestDto } from './dto/update-user-email-start-request.dto';
import { UpdateUserPasswordRequestDto } from './dto/update-user-password-request.dto';
import { UserDetailResponseDto } from './dto/user-detail-response.dto';
import { UserSummaryResponseDto } from './dto/user-summary-response.dto';
import { UsersService } from './users.service';
import { JwtCookieAuthGuard } from '../auth/guards/jwt-cookie-auth.guard';

@Controller('users')
@UseGuards(JwtCookieAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private verificationService: VerificationService,
  ) {}

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

  @Post('me/email/start')
  async updateEmailMeStart(
    @Request() request,
    @Body() data: UpdateUserEmailStartRequestDto,
  ) {
    await this.verificationService.issueEmailChange(
      request.user.sub,
      data.email,
    );
  }

  @Post('me/email/confirm')
  async updateEmailMeConfirm(
    @Request() request,
    @Body() data: UpdateUserEmailConfirmRequestDto,
  ) {
    const email = await this.verificationService.validateEmailChange(
      request.user.sub,
      data.otp,
    );
    return plainToInstance(UpdateUserEmailConfirmResponseDto, { email });
  }

  @Put('me/password')
  async updatePasswordMe(
    @Request() request,
    @Body() data: UpdateUserPasswordRequestDto,
  ) {
    await this.usersService.updatePassword(
      request.user.sub,
      data.oldPassword,
      data.newPassword,
    );
  }

  @Put('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateAvatarMe(
    @Request() request,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    const avatarUrl = await this.usersService.updateAvatar(
      request.user.sub,
      avatar.buffer,
    );
    return plainToInstance(UpdateUserAvatarResponseDto, { avatarUrl });
  }
}
