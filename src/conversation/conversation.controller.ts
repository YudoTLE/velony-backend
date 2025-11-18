import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { JwtCookieAuthGuard } from 'src/auth/guards/jwt-cookie-auth.guard';
import { CreateMessageRequestDto } from 'src/message/dto/create-message-request.dto';
import { CreateMessageResponseDto } from 'src/message/dto/create-message-response.dto';
import { MessageResponseDto } from 'src/message/dto/message-response.dto';
import { MessageService } from 'src/message/message.service';

import { ConversationService } from './conversation.service';
import { ConversationDetailResponseDto } from './dto/conversation-detail-response.dto';
import { ConversationSummaryResponseDto } from './dto/conversation-summary-response.dto';
import { ListMessagesQueryDto } from '../message/dto/list-messages-query.dto';

@Controller('conversations')
@UseGuards(JwtCookieAuthGuard)
export class ConversationController {
  constructor(
    private conversationService: ConversationService,
    private messageService: MessageService,
  ) {}

  @Get()
  async findAll(@Request() request) {
    return plainToInstance(
      ConversationSummaryResponseDto,
      await this.conversationService.findAllByUserUuid(request.user.sub),
    );
  }

  @Get(':uuid')
  async findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<ConversationDetailResponseDto> {
    return plainToInstance(
      ConversationDetailResponseDto,
      await this.conversationService.findByUuid(uuid),
    );
  }

  @Get(':uuid/messages')
  async findAllMessages(
    @Request() request,
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Query() query: ListMessagesQueryDto,
  ) {
    return plainToInstance(
      MessageResponseDto,
      await this.messageService.findAllByConversationUuid(
        uuid,
        request.user.sub,
        query,
      ),
    );
  }

  @Post(':uuid/messages')
  async createMessage(
    @Request() request,
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() data: CreateMessageRequestDto,
  ) {
    return plainToInstance(
      CreateMessageResponseDto,
      await this.messageService.create(uuid, request.user.sub, data),
    );
  }
}
