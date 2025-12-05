import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { JwtCookieAuthGuard } from 'src/auth/guards/jwt-cookie-auth.guard';
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
    @Request() request,
    @Query() query: GetDirtyConversationsQueryDto,
  ) {
    return plainToInstance(
      GetDirtyConversationsResponseDto,
      await this.conversationsService.findAllDirtyAfterCursorByUserId(
        request.user.sub,
        query,
      ),
    );
  }

  @Get(':uuid')
  async findOne(
    @Request() request,
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ) {
    return plainToInstance(
      GetConversationResponseDto,
      await this.conversationsService.findOneByUuid(uuid, request.user.sub),
    );
  }

  @Get(':uuid/messages/older')
  async findAllOlderMessages(
    @Request() request,
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Query() query: GetOlderMessagesQueryDto,
  ) {
    return plainToInstance(
      GetOlderMessagesResponseDto,
      await this.messagesService.findAllBeforeCursorByConversationUuid(
        uuid,
        request.user.sub,
        query,
      ),
    );
  }

  @Get(':uuid/messages/dirty')
  async findAllDirtyMessages(
    @Request() request,
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Query() query: GetDirtyMessagesQueryDto,
  ) {
    return plainToInstance(
      GetDirtyMessagesResponseDto,
      await this.messagesService.findAllDirtyAfterCursorByConversationUuid(
        uuid,
        request.user.sub,
        query,
      ),
    );
  }

  @Get(':uuid/users/dirty')
  async findAllDirtyUsers(
    @Request() request,
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Query() query: GetDirtyUsersQueryDto,
  ) {
    return plainToInstance(
      GetDirtyUsersResponseDto,
      await this.usersService.findAllDirtyAfterCursorByConversationUuid(
        uuid,
        request.user.sub,
        query,
      ),
    );
  }
}
