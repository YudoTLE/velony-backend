import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { JwtCookieAuthGuard } from 'src/auth/guards/jwt-cookie-auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { GetDirtyMessagesQueryDto } from 'src/messages/dto/get-dirty-messages-query.dto';
import { GetDirtyMessagesResponseDto } from 'src/messages/dto/get-dirty-messages-response.dto';
import { GetOlderMessagesQueryDto } from 'src/messages/dto/get-older-messages-query.dto';
import { GetOlderMessagesResponseDto } from 'src/messages/dto/get-older-messages-response.dto';
import { MessagesService } from 'src/messages/messages.service';
import { GetDirtyUsersQueryDto } from 'src/users/dto/get-dirty-users-query.dto';
import { GetDirtyUsersResponseDto } from 'src/users/dto/get-dirty-users-response.dto';
import { UsersService } from 'src/users/users.service';

import { ConversationsService } from './conversations.service';
import { GetConversationResponseDto } from './dto/get-conversation-response.dto';
import { GetDirtyConversationsQueryDto } from './dto/get-dirty-conversations-query.dto';
import { GetDirtyConversationsResponseDto } from './dto/get-dirty-conversations-response.dto';

@Controller('conversations')
@UseGuards(JwtCookieAuthGuard)
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
  ) {}

  @Get('dirty')
  async findAllDirty(
    @User('sub') sub: string,
    @Query() query: GetDirtyConversationsQueryDto,
  ) {
    return plainToInstance(
      GetDirtyConversationsResponseDto,
      await this.conversationsService.findAllDirtyAfterCursorByUserId(
        sub,
        query,
      ),
    );
  }

  @Get(':uuid')
  async findOne(
    @User('sub') sub: string,
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ) {
    return plainToInstance(
      GetConversationResponseDto,
      await this.conversationsService.findOneByUuid(uuid, sub),
    );
  }

  @Get(':uuid/messages/older')
  async findAllOlderMessages(
    @User('sub') sub: string,
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Query() query: GetOlderMessagesQueryDto,
  ) {
    return plainToInstance(
      GetOlderMessagesResponseDto,
      await this.messagesService.findAllBeforeCursorByConversationUuid(
        uuid,
        sub,
        query,
      ),
    );
  }

  @Get(':uuid/messages/dirty')
  async findAllDirtyMessages(
    @User('sub') sub: string,
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Query() query: GetDirtyMessagesQueryDto,
  ) {
    return plainToInstance(
      GetDirtyMessagesResponseDto,
      await this.messagesService.findAllDirtyAfterCursorByConversationUuid(
        uuid,
        sub,
        query,
      ),
    );
  }

  @Get(':uuid/users/dirty')
  async findAllDirtyUsers(
    @User('sub') sub: string,
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Query() query: GetDirtyUsersQueryDto,
  ) {
    return plainToInstance(
      GetDirtyUsersResponseDto,
      await this.usersService.findAllDirtyAfterCursorByConversationUuid(
        uuid,
        sub,
        query,
      ),
    );
  }
}
