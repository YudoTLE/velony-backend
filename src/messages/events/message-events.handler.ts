import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { plainToInstance } from 'class-transformer';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { UsersRepository } from 'src/users/users.repository';

import { MessageCreatedEvent } from './message-created.event';
import { MessageDeletedEvent } from './message-deleted.event';
import { MessageUpdatedEvent } from './message-updated.event';
import { MessageResponseDto } from '../dto/message-response.dto';

@Injectable()
export class MessageEventsHandler {
  constructor(
    private readonly realtimeGateway: RealtimeGateway,
    private readonly usersRepository: UsersRepository,
  ) {}

  @OnEvent('message.created')
  async handleMessageCreated(event: MessageCreatedEvent) {
    const participantUuids = await this.usersRepository
      .findAllByConversationId(event.conversationId, {
        fields: ['uuid'],
      })
      .then((list) => list.map((u) => u.uuid));

    participantUuids.forEach((uuid) => {
      this.realtimeGateway.server.to(uuid).emit('message.created', {
        ...(event.optimisticId && { optimisticId: event.optimisticId }),
        message: plainToInstance(MessageResponseDto, {
          ...event.message,
          is_self: uuid === event.message.user_uuid,
        }),
      });
    });
  }

  @OnEvent('message.updated')
  async handleMessageUpdated(event: MessageUpdatedEvent) {
    const participantUuids = await this.usersRepository
      .findAllByConversationId(event.conversationId, {
        fields: ['uuid'],
      })
      .then((list) => list.map((u) => u.uuid));

    participantUuids.forEach((uuid) => {
      this.realtimeGateway.server.to(uuid).emit('message.updated', {
        message: plainToInstance(MessageResponseDto, {
          ...event.message,
          is_self: uuid === event.message.user_uuid,
        }),
      });
    });
  }

  @OnEvent('message.deleted')
  async handleMessageDeleted(event: MessageDeletedEvent) {
    const participantUuids = await this.usersRepository
      .findAllByConversationId(event.conversationId, {
        fields: ['uuid'],
      })
      .then((list) => list.map((u) => u.uuid));

    participantUuids.forEach((uuid) => {
      this.realtimeGateway.server.to(uuid).emit('message.deleted', {
        message: plainToInstance(MessageResponseDto, {
          ...event.message,
          is_self: uuid === event.message.user_uuid,
        }),
      });
    });
  }
}
