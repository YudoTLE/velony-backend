import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { plainToInstance } from 'class-transformer';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { UsersRepository } from 'src/users/users.repository';

import { MessageCreatedEvent } from './message-created.event';
import { MessageDeletedEvent } from './message-deleted.event';
import { MessageUpdatedEvent } from './message-updated.event';
import { WsMessageCreatedResponseDto } from '../dto/ws-message-created-response.dto';
import { WsMessageDeletedResponseDto } from '../dto/ws-message-deleted-response.dto';
import { WsMessageUpdateResponseDto } from '../dto/ws-message-updated-response.dto';

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
      this.realtimeGateway.server.to(uuid).emit(
        'message.created',
        plainToInstance(WsMessageCreatedResponseDto, {
          message: {
            ...event.message,
            is_self: uuid === event.message.user_uuid,
          },
          optimisticId: event.optimisticId,
        }),
      );
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
      this.realtimeGateway.server
        .to(uuid)
        .emit(
          'message.updated',
          plainToInstance(WsMessageUpdateResponseDto, event),
        );
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
      this.realtimeGateway.server
        .to(uuid)
        .emit(
          'message.deleted',
          plainToInstance(WsMessageDeletedResponseDto, event),
        );
    });
  }
}
