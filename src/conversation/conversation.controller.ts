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
import { MessageResponseDto } from 'src/message/dto/message-response.dto';
import { MessageService } from 'src/message/message.service';

import { ConversationService } from './conversation.service';
import { ConversationDetailResponseDto } from './dto/conversation-detail-response.dto';
import { ConversationSummaryResponseDto } from './dto/conversation-summary-response.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';

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
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Query() query: ListMessagesQueryDto,
  ) {
    return plainToInstance(
      MessageResponseDto,
      await this.messageService.findAllByConversationUuid(uuid, query),
    );
  }
}
