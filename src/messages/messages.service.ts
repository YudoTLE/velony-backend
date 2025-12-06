import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConversationsRepository } from 'src/conversations/conversations.repository';
import { ConversationNotFoundException } from 'src/exceptions/conversation-not-found.excpetion';
import { MessageNotFoundException } from 'src/exceptions/message-not-found.excpetion';
import { UserConversationsRepository } from 'src/user-conversations/user-conversations.repository';
import { UsersRepository } from 'src/users/users.repository';

import { CreateMessageRequestDto } from './dto/create-message-request.dto';
import { DeleteMessageRequestDto } from './dto/delete-message-request.dto';
import { GetDirtyMessagesQueryDto } from './dto/get-dirty-messages-query.dto';
import { GetOlderMessagesQueryDto } from './dto/get-older-messages-query.dto';
import { UpdateMessageRequestDto } from './dto/update-message-request.dto';
import { MessageCreatedEvent } from './events/message-created.event';
import { MessageDeletedEvent } from './events/message-deleted.event';
import { MessageUpdatedEvent } from './events/message-updated.event';
import { MessagesRepository } from './messages.repository';

@Injectable()
export class MessagesService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly messagesRepository: MessagesRepository,
    private readonly conversationsRepository: ConversationsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly userConversationsRepository: UserConversationsRepository,
  ) {}

  async findAllDirtyAfterCursorByConversationUuid(
    conversationUuid: string,
    requesterUuid: string,
    options: GetDirtyMessagesQueryDto,
  ) {
    const [requesterId, conversationId, cursorMessage, cursorOldestMessage] =
      await Promise.all([
        this.usersRepository
          .findOneBy('uuid', requesterUuid, { fields: ['id'] })
          .then((u) => u?.id),
        this.conversationsRepository
          .findOneBy('uuid', conversationUuid, { fields: ['id'] })
          .then((c) => c?.id),
        options.cursor
          ? this.messagesRepository.findOneBy(
              'uuid',
              options.cursor.messageId,
              {
                fields: ['id', 'conversation_id'],
              },
            )
          : Promise.resolve(undefined),
        options.cursor
          ? this.messagesRepository.findOneBy(
              'uuid',
              options.cursor.oldestMessageId,
              {
                fields: ['id', 'conversation_id'],
              },
            )
          : Promise.resolve(undefined),
      ]);
    if (!requesterId || !conversationId)
      throw new ConversationNotFoundException();

    const isAuthorized = !!(await this.userConversationsRepository.findOne({
      userId: requesterId,
      conversationId,
    }));
    if (!isAuthorized) throw new ConversationNotFoundException();

    if (
      options.cursor &&
      (cursorMessage?.conversation_id !== conversationId ||
        cursorOldestMessage?.conversation_id !== conversationId)
    )
      throw new MessageNotFoundException();

    const messages = await this.messagesRepository
      .findAllDirtyAfterCursorByConversationId(conversationId, {
        cursor: options.cursor
          ? {
              messageId: cursorMessage!.id,
              updatedAt: options.cursor.updatedAt,
              oldestMessageId: cursorOldestMessage!.id,
            }
          : undefined,
        limit: options.limit,
        fields: [
          'uuid',
          'previous_uuid',
          'user_uuid',
          'conversation_uuid',
          'content',
          'created_at',
          'updated_at',

          'deleted_at',
          'user_id',
        ],
      })
      .then((list) =>
        list.map((m) => ({
          ...m,
          is_self: m.user_uuid === requesterUuid,
        })),
      );

    const users = await this.usersRepository.findAllBy(
      'ids',
      Array.from(new Set(messages.map((m) => m.user_id))),
      {
        fields: [
          'uuid',
          'name',
          'username',
          'avatar_url',
          'email',
          'phone_number',
          'created_at',
        ],
        deleted: false,
      },
    );

    return {
      messages,
      dependencies: { users },
    };
  }

  async findAllBeforeCursorByConversationUuid(
    conversationUuid: string,
    requesterUuid: string,
    options: GetOlderMessagesQueryDto,
  ) {
    const [requesterId, conversationId, cursorMessage] = await Promise.all([
      this.usersRepository
        .findOneBy('uuid', requesterUuid, { fields: ['id'] })
        .then((u) => u?.id),
      this.conversationsRepository
        .findOneBy('uuid', conversationUuid, { fields: ['id'] })
        .then((c) => c?.id),
      options.cursor
        ? this.messagesRepository.findOneBy('uuid', options.cursor.messageId, {
            fields: ['id', 'conversation_id'],
          })
        : Promise.resolve(undefined),
    ]);
    if (!requesterId || !conversationId)
      throw new ConversationNotFoundException();

    const isAuthorized = !!(await this.userConversationsRepository.findOne({
      userId: requesterId,
      conversationId,
    }));
    if (!isAuthorized) throw new ConversationNotFoundException();

    if (options.cursor && cursorMessage?.conversation_id !== conversationId)
      throw new MessageNotFoundException();

    const messages = await this.messagesRepository
      .findAllBeforeCursorByConversationId(conversationId, {
        cursor: options.cursor ? { messageId: cursorMessage!.id } : undefined,
        limit: options.limit,
        fields: [
          'uuid',
          'previous_uuid',
          'user_uuid',
          'conversation_uuid',
          'content',
          'created_at',
          'updated_at',
          'deleted_at',

          'user_id',
        ],
      })
      .then((list) =>
        list.map((m) => ({
          ...m,
          content: m.deleted_at === null ? m.content : 'Deleted message',
          is_self: m.user_uuid === requesterUuid,
        })),
      );

    const users = await this.usersRepository.findAllBy(
      'ids',
      messages.map((m) => m.user_id),
      {
        fields: [
          'uuid',
          'name',
          'username',
          'avatar_url',
          'email',
          'phone_number',
          'created_at',
        ],
        deleted: false,
      },
    );

    return { messages, dependencies: { users } };
  }

  async createOne(requesterUuid: string, dto: CreateMessageRequestDto) {
    const [requesterId, conversationId] = await Promise.all([
      this.usersRepository
        .findOneBy('uuid', requesterUuid, { fields: ['id'] })
        .then((u) => u?.id),
      this.conversationsRepository
        .findOneBy('uuid', dto.conversationId, { fields: ['id'] })
        .then((c) => c?.id),
    ]);
    if (!requesterId || !conversationId)
      throw new ConversationNotFoundException();

    const isAuthorized = !!(await this.userConversationsRepository.findOne({
      userId: requesterId,
      conversationId,
    }));
    if (!isAuthorized) throw new ConversationNotFoundException();

    const newMessage = await this.messagesRepository.createOne(
      {
        content: dto.content,
        conversation_id: conversationId,
        user_id: requesterId,
      },
      {
        fields: [
          'id',
          'uuid',
          'previous_uuid',
          'user_uuid',
          'conversation_uuid',
          'content',
          'created_at',
          'updated_at',
        ],
      },
    );

    this.eventEmitter.emit(
      'message.created',
      new MessageCreatedEvent(newMessage, conversationId, dto.optimisticId),
    );
  }

  async updateOne(requesterUuid: string, dto: UpdateMessageRequestDto) {
    const [requesterId, message] = await Promise.all([
      this.usersRepository
        .findOneBy('uuid', requesterUuid, { fields: ['id'] })
        .then((u) => {
          if (!u) throw new MessageNotFoundException();
          return u.id;
        }),
      this.messagesRepository
        .findOneBy('uuid', dto.id, {
          fields: ['id', 'user_id', 'conversation_id'],
          deleted: false,
        })
        .then((m) => {
          if (!m) throw new MessageNotFoundException();
          return m;
        }),
    ]);

    await this.userConversationsRepository
      .findOne({
        userId: requesterId,
        conversationId: message.conversation_id,
      })
      .then((uc) => {
        if (!uc) throw new MessageNotFoundException();
      });

    const updatedMessage = await this.messagesRepository.updateOneBy(
      'id',
      message.id,
      {
        content: dto.content,
      },
      {
        fields: [
          'id',
          'uuid',
          'previous_uuid',
          'user_uuid',
          'conversation_uuid',
          'content',
          'created_at',
          'updated_at',
        ],
      },
    );
    if (!updatedMessage) throw new MessageNotFoundException();

    this.eventEmitter.emit(
      'message.updated',
      new MessageUpdatedEvent(updatedMessage, message.conversation_id),
    );
  }

  async deleteOne(requesterUuid: string, dto: DeleteMessageRequestDto) {
    const [requesterId, message] = await Promise.all([
      this.usersRepository
        .findOneBy('uuid', requesterUuid, { fields: ['id'] })
        .then((u) => {
          if (!u) throw new MessageNotFoundException();
          return u.id;
        }),
      this.messagesRepository
        .findOneBy('uuid', dto.id, {
          fields: ['id', 'user_id', 'conversation_id'],
          deleted: false,
        })
        .then((m) => {
          if (!m) throw new MessageNotFoundException();
          return m;
        }),
    ]);

    const role = await this.userConversationsRepository
      .findOne(
        {
          userId: requesterId,
          conversationId: message.conversation_id,
        },
        { fields: ['role'], deleted: false },
      )
      .then((uc) => uc?.role);

    if (
      message.user_id !== requesterId ||
      !(role === 'admin' || role === 'owner')
    )
      throw new UnauthorizedException();

    // const deletedMessage = await this.messagesRepository.deleteOneBy(
    //   'id',
    //   message.id,
    //   {
    //     fields: [
    //       'id',
    //       'uuid',
    //       'previous_uuid',
    //       'user_uuid',
    //       'conversation_uuid',
    //       'created_at',
    //       'updated_at',
    //       'deleted_at',
    //     ],
    //   },
    // );

    // this.eventEmitter.emit(
    //   'message.deleted',
    //   new MessageDeletedEvent(deletedMessage, message.conversation_id),
    // );
  }
}
