import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { JwtCookieAuthGuard } from 'src/auth/guards/jwt-cookie-auth.guard';

import { ConversationsService } from './conversations.service';
import { ConversationDetailResponseDto } from './dto/conversation-detail-response.dto';
import { ConversationSummaryResponseDto } from './dto/conversation-summary-response.dto';

@Controller('conversations')
@UseGuards(JwtCookieAuthGuard)
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Get()
  async findAll(@Request() request) {
    return plainToInstance(
      ConversationSummaryResponseDto,
      await this.conversationsService.findAllByUserUuid(request.user.sub),
    );
  }

  @Get(':uuid')
  async findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<ConversationDetailResponseDto> {
    return plainToInstance(
      ConversationDetailResponseDto,
      await this.conversationsService.findByUuid(uuid),
    );
  }
}
