import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class MessageService {
  constructor(private databaseService: DatabaseService) {}

  async findAllByConversationUuid(
    conversationUuid: string,
    options: { before?: string; limit?: number } = {},
  ) {
    const conversation = await (async () => {
      const query = `
        SELECT id
        FROM conversations
        WHERE uuid = $1
      `;
      const result = await this.databaseService.query(query, [
        conversationUuid,
      ]);
      return result.rows[0];
    })();
    if (!conversation) throw new NotFoundException('Conversation not found');

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
      let paramIndex = 1;

      let cursorCondition = '';
      if (options.before) {
        cursorCondition = `AND m.id < $${++paramIndex}`;
        params.push(messageCursor.id);
      }

      let limitClause = '';
      if (options.limit) {
        limitClause = `LIMIT $${++paramIndex}`;
        params.push(options.limit);
      }

      const query = `
        SELECT
          m.uuid,
          m.content,
          m.created_at,
          m.updated_at,
          u.uuid AS user_uuid
        FROM messages m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.conversation_id = $1
          ${cursorCondition}
        ORDER BY m.id DESC
        ${limitClause}
      `;

      const result = await this.databaseService.query(query, params);
      return result.rows;
    })();

    return messages;
  }
}
