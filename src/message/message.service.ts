import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ConversationService } from 'src/conversation/conversation.service';
import { DatabaseService } from 'src/database/database.service';

import { CreateMessageRequestDto } from './dto/create-message-request.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { MessageGateway } from './message.gateway';

@Injectable()
export class MessageService {
  constructor(
    private databaseService: DatabaseService,
    private messageGateway: MessageGateway,
    private conversationService: ConversationService,
  ) {}

  async findAllByConversationUuid(
    conversationUuid: string,
    retrieverUuid: string,
    options: { before?: string; limit?: number } = {},
  ) {
    const [user, conversation] = await Promise.all([
      (async () => {
        const query = `
          SELECT id
          FROM users
          WHERE uuid = $1
        `;
        const result = await this.databaseService.query(query, [retrieverUuid]);
        return result.rows[0];
      })(),
      (async () => {
        const query = `
          SELECT id
          FROM conversations
          WHERE uuid = $1
        `;
        const result = await this.databaseService.query(query, [
          conversationUuid,
        ]);
        return result.rows[0];
      })(),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isResourceOwner = await (async () => {
      const query = `
        SELECT 1
        FROM user_conversations
        WHERE user_id = $1 AND conversation_id = $2
      `;
      const result = await this.databaseService.query(query, [
        user.id,
        conversation.id,
      ]);
      return !!result.rows[0];
    })();
    if (!isResourceOwner) throw new NotFoundException('Conversation not found');

    const messageCursor = await (async () => {
      if (!options.before) return null;

      const query = `
        SELECT id
        FROM messages
        WHERE uuid = $1
      `;
      const result = await this.databaseService.query(query, [options.before]);
      return result.rows[0];
    })();
    if (options.before && !messageCursor)
      throw new NotFoundException('Message cursor not found');

    const messages = await (async () => {
      const params = [conversation.id];
      let paramIndex = 2;

      let cursorCondition = '';
      if (options.before) {
        cursorCondition = `AND m.id < $${paramIndex++}`;
        params.push(messageCursor.id);
      }

      let limitClause = '';
      if (options.limit) {
        limitClause = `LIMIT $${paramIndex++}`;
        params.push(options.limit);
      }

      const query = `
        SELECT
          m.uuid,
          m.content,
          m.created_at,
          m.updated_at,
          pm.uuid AS previous_uuid,
          u.uuid AS user_uuid
        FROM messages m
        LEFT JOIN messages pm ON pm.id = m.previous_id
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.conversation_id = $1
          ${cursorCondition}
        ORDER BY m.id DESC
        ${limitClause}
      `;

      const result = await this.databaseService.query(query, params);
      result.rows.reverse();
      return result.rows;
    })();

    return messages.map((m) => ({
      ...m,
      is_self: m.user_uuid === retrieverUuid,
    }));
  }

  async create(
    conversationUuid: string,
    requesterUuid: string,
    data: CreateMessageRequestDto,
  ) {
    const [user, conversation] = await Promise.all([
      (async () => {
        const query = `
          SELECT id
          FROM users
          WHERE uuid = $1
        `;
        const result = await this.databaseService.query(query, [requesterUuid]);
        return result.rows[0];
      })(),
      (async () => {
        const query = `
          SELECT id
          FROM conversations
          WHERE uuid = $1
        `;
        const result = await this.databaseService.query(query, [
          conversationUuid,
        ]);
        return result.rows[0];
      })(),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isResourceOwner = await (async () => {
      const query = `
        SELECT 1
        FROM user_conversations
        WHERE user_id = $1 AND conversation_id = $2
      `;
      const result = await this.databaseService.query(query, [
        user.id,
        conversation.id,
      ]);
      return !!result.rows[0];
    })();
    if (!isResourceOwner) throw new NotFoundException('Conversation not found');

    const newMessage = await (async () => {
      const query = `
        WITH inserted AS (
          INSERT INTO messages (
            user_id,
            conversation_id,
            content
          )
          VALUES ($1, $2, $3)
          RETURNING
            id,
            uuid,
            previous_id,
            user_id,
            content,
            created_at,
            updated_at
        )
        SELECT
          i.uuid,
          i.content,
          i.created_at,
          i.updated_at,
          pm.uuid AS previous_uuid,
          u.uuid AS user_uuid
        FROM inserted i
        LEFT JOIN messages pm ON pm.id = i.previous_id
        LEFT JOIN users u ON u.id = i.user_id
      `;
      const result = await this.databaseService.query(query, [
        user.id,
        conversation.id,
        data.content,
      ]);
      return result.rows[0];
    })();

    (async () => {
      const participantUUIDs =
        await this.conversationService.findAllParticipantUUIDs(conversation.id);
      participantUUIDs.forEach((uuid) => {
        this.messageGateway.server
          .of('/users')
          .to(uuid)
          .emit('NEW_MESSAGE', {
            ...(data.optimisticId && { optimisticId: data.optimisticId }),
            message: plainToInstance(MessageResponseDto, newMessage),
          });
      });
    })();

    return newMessage;
  }
}
