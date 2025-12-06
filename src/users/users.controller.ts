import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  ParseUUIDPipe,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { JwtCookieAuthGuard } from 'src/auth/guards/jwt-cookie-auth.guard';
import { User } from 'src/common/decorators/user.decorator';
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
  async findMe(@User('sub') sub: string) {
    const user = await this.usersService.findOneByUuid(sub);
    return plainToInstance(GetUserResponseDto, user);
  }

  @Get(':uuid')
  async findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
    const user = await this.usersService.findOneByUuid(uuid);
    return plainToInstance(GetUserResponseDto, user);
  }

  @Put('me/username')
  async updateUsername(
    @User('sub') sub: string,
    @Body() dto: UpdateUserUsernameRequestDto,
  ) {
    const username = await this.usersService.updateUsername(sub, dto.username);
    return plainToInstance(UpdateUserUsernameResponseDto, { username });
  }

  @Put('me/name')
  async updateName(
    @User('sub') sub: string,
    @Body() dto: UpdateUserNameRequestDto,
  ) {
    const name = await this.usersService.updateName(sub, dto.name);
    return plainToInstance(UpdateUserNameResponseDto, { name });
  }

  @Post('me/email/start')
  async updateEmailMeStart(
    @User('sub') sub: string,
    @Body() dto: UpdateUserEmailStartRequestDto,
  ) {
    await this.verificationService.issueEmailChange(sub, dto.email);
  }

  @Post('me/email/confirm')
  async updateEmailMeConfirm(
    @User('sub') sub: string,
    @Body() dto: UpdateUserEmailConfirmRequestDto,
  ) {
    const email = await this.verificationService.validateEmailChange(
      sub,
      dto.otp,
    );
    await this.usersService.updateEmail(sub, email);
    return plainToInstance(UpdateUserEmailConfirmResponseDto, { email });
  }

  @Put('me/password')
  async updatePasswordMe(
    @User('sub') sub: string,
    @Body() dto: UpdateUserPasswordRequestDto,
  ) {
    await this.usersService.updatePassword(sub, dto);
  }

  @Put('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateAvatarMe(
    @User('sub') sub: string,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    const avatarUrl = await this.usersService.updateAvatar(sub, avatar.buffer);
    return plainToInstance(UpdateUserAvatarResponseDto, { avatarUrl });
  }
}
