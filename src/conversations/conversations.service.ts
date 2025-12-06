import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ConversationNotFoundException } from 'src/common/exceptions/conversation-not-found.excpetion';
import { UserConversationsRepository } from 'src/user-conversations/user-conversations.repository';
import { UsersRepository } from 'src/users/users.repository';

import { ConversationsRepository } from './conversations.repository';
import { CreateConversationRequestDto } from './dto/create-conversation-request.dto';
import { GetDirtyConversationsQueryDto } from './dto/get-dirty-conversations-query.dto';
import { UpdateConversationRequestDto } from './dto/update-conversation-request.dto';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly conversationsRepository: ConversationsRepository,
    private readonly userConversationsRepository: UserConversationsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async findOneByUuid(uuid: string, requesterUuid: string) {
    const [conversation, requesterId] = await Promise.all([
      this.conversationsRepository.findOneBy('uuid', uuid, {
        fields: [
          'id',
          'uuid',
          'title',
          'description',
          'thumbnail_url',
          'created_at',
          'updated_at',
        ],
        deleted: false,
      }),
      this.usersRepository
        .findOneBy('uuid', requesterUuid, { fields: ['id'] })
        .then((u) => u?.id),
    ]);
    if (!conversation || !requesterId)
      throw new ConversationNotFoundException();

    const isAuthorized = !!(await this.userConversationsRepository.findOne({
      userId: requesterId,
      conversationId: conversation.id,
    }));
    if (!isAuthorized) throw new ConversationNotFoundException();

    return { conversation };
  }

  async findAllDirtyAfterCursorByUserId(
    requesterUuid: string,
    options: GetDirtyConversationsQueryDto,
  ) {
    const [requesterId, cursorConversation] = await Promise.all([
      this.usersRepository
        .findOneBy('uuid', requesterUuid, { fields: ['id'] })
        .then((u) => u?.id),
      options.cursor
        ? this.conversationsRepository.findOneBy(
            'uuid',
            options.cursor.conversationId,
            {
              fields: ['id'],
            },
          )
        : Promise.resolve(undefined),
    ]);
    if (!requesterId) throw new ConversationNotFoundException();

    const conversations =
      await this.conversationsRepository.findAllDirtyAfterCursorByUserId(
        requesterId,
        {
          cursor: options.cursor
            ? {
                conversationId: cursorConversation!.id,
                updatedAt: options.cursor.updatedAt,
              }
            : undefined,
          limit: options.limit,
          fields: [
            'uuid',
            'title',
            'description',
            'thumbnail_url',
            'created_at',
            'updated_at',
            'deleted_at',
          ],
        },
      );

    return { conversations };
  }

  async createOne(requesterUuid: string, dto: CreateConversationRequestDto) {
    return this.databaseService.transaction(async () => {
      const [requesterId, newConversationId] = await Promise.all([
        this.usersRepository
          .findOneBy('uuid', requesterUuid, { fields: ['id'] })
          .then((u) => u?.id),
        this.conversationsRepository
          .createOne(
            {
              title: dto.title,
              description: dto.description,
            },
            { fields: ['id'] },
          )
          .then((c) => c.id),
      ]);
      // TODO: Make an actual custom exception
      if (!requesterId) throw new BadRequestException();

      await this.userConversationsRepository.createOne(
        {
          user_id: requesterId,
          conversation_id: newConversationId,
          role: 'owner',
        },
        { fields: [] },
      );
    });
  }

  async updateOne(
    uuid: string,
    requesterUuid: string,
    dto: UpdateConversationRequestDto,
  ) {
    const [conversationId, requesterId] = await Promise.all([
      this.conversationsRepository
        .findOneBy('uuid', uuid, { fields: ['id'] })
        .then((c) => c?.id),
      this.usersRepository
        .findOneBy('uuid', requesterUuid, { fields: ['id'] })
        .then((u) => u?.id),
    ]);
    if (!requesterId || !conversationId)
      throw new ConversationNotFoundException();

    const isAuthorized = !!(await this.userConversationsRepository.findOne({
      userId: requesterId,
      conversationId,
    }));
    if (!isAuthorized) throw new ConversationNotFoundException();

    await this.conversationsRepository.updateOneBy(
      'id',
      conversationId,
      {
        title: dto.title,
        description: dto.description,
      },
      { fields: [] },
    );
  }
}
