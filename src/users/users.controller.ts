import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  ParseUUIDPipe,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { JwtCookieAuthGuard } from 'src/auth/guards/jwt-cookie-auth.guard';
import { VerificationService } from 'src/verification/verification.service';

import { GetUserResponseDto } from './dto/get-user-response.dto';
import { UpdateUserAvatarResponseDto } from './dto/update-user-avatar-response.dto';
import { UpdateUserEmailConfirmRequestDto } from './dto/update-user-email-confirm-request.dto';
import { UpdateUserEmailConfirmResponseDto } from './dto/update-user-email-confirm-response.dto';
import { UpdateUserEmailStartRequestDto } from './dto/update-user-email-start-request.dto';
import { UpdateUserNameRequestDto } from './dto/update-user-name-request.dto';
import { UpdateUserNameResponseDto } from './dto/update-user-name-response.dto';
import { UpdateUserPasswordRequestDto } from './dto/update-user-password-request.dto';
import { UpdateUserUsernameRequestDto } from './dto/update-user-username-request.dto';
import { UpdateUserUsernameResponseDto } from './dto/update-user-username-response.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtCookieAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly verificationService: VerificationService,
  ) {}

  @Get('me')
  async findMe(@Request() request) {
    const user = await this.usersService.findOneByUuid(request.user.sub);
    return plainToInstance(GetUserResponseDto, user);
  }

  @Get(':uuid')
  async findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
    const user = await this.usersService.findOneByUuid(uuid);
    return plainToInstance(GetUserResponseDto, user);
  }

  @Put('me/username')
  async updateUsername(
    @Request() request,
    @Body() dto: UpdateUserUsernameRequestDto,
  ) {
    const username = await this.usersService.updateUsername(
      request.user.sub,
      dto.username,
    );
    return plainToInstance(UpdateUserUsernameResponseDto, { username });
  }

  @Put('me/name')
  async updateName(@Request() request, @Body() dto: UpdateUserNameRequestDto) {
    const name = await this.usersService.updateName(request.user.sub, dto.name);
    return plainToInstance(UpdateUserNameResponseDto, { name });
  }

  @Post('me/email/start')
  async updateEmailMeStart(
    @Request() request,
    @Body() dto: UpdateUserEmailStartRequestDto,
  ) {
    await this.verificationService.issueEmailChange(
      request.user.sub,
      dto.email,
    );
  }

  @Post('me/email/confirm')
  async updateEmailMeConfirm(
    @Request() request,
    @Body() dto: UpdateUserEmailConfirmRequestDto,
  ) {
    const email = await this.verificationService.validateEmailChange(
      request.user.sub,
      dto.otp,
    );
    await this.usersService.updateEmail(request.user.sub, email);
    return plainToInstance(UpdateUserEmailConfirmResponseDto, { email });
  }

  @Put('me/password')
  async updatePasswordMe(
    @Request() request,
    @Body() dto: UpdateUserPasswordRequestDto,
  ) {
    await this.usersService.updatePassword(request.user.sub, dto);
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
