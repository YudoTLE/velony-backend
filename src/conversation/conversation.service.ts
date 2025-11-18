import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ConversationService {
  constructor(private databaseService: DatabaseService) {}

  async findAllByUserUuid(userUuid: string) {
    const user = await (async () => {
      const query = `
        SELECT id
        FROM users
        WHERE uuid = $1
      `;
      const result = await this.databaseService.query(query, [userUuid]);
      return result.rows[0];
    })();
    if (!user) throw new NotFoundException('User not found');

    const conversations = await (async () => {
      const query = `
        SELECT
          c.uuid,
          c.title,
          c.thumbnail_url,
          c.created_at AS conversation_created_at,
          m.uuid AS last_message_uuid,
          m.content AS last_message_content,
          m.created_at AS last_message_created_at,
          m.updated_at AS last_message_updated_at,
          u.name AS last_message_user_name
        FROM user_conversations uc
        JOIN conversations c
          ON uc.conversation_id = c.id
        LEFT JOIN LATERAL (
          SELECT *
          FROM messages
          WHERE conversation_id = c.id
          ORDER BY created_at DESC, id DESC
          LIMIT 1
        ) m ON TRUE
        LEFT JOIN users u
          ON u.id = m.user_id
        WHERE uc.user_id = $1
        ORDER BY COALESCE(m.created_at, c.created_at) DESC;
      `;
      const result = await this.databaseService.query(query, [user.id]);
      return result.rows;
    })();

    return conversations.map((c) => ({
      uuid: c.uuid,
      title: c.title,
      thumbnail_url: c.thumbnail_url,
      created_at: c.created_at,
      last_message: c.last_message_uuid
        ? {
            uuid: c.last_message_uuid,
            content: c.last_message_content,
            user_name: c.last_message_user_name,
            created_at: c.last_message_created_at,
            updated_at: c.last_message_updated_at,
          }
        : null,
    }));
  }

  async findByUuid(uuid: string) {
    const conversation = await (async () => {
      const query = `
        SELECT
          id,
          uuid,
          title,
          description,
          thumbnail_url,
          created_at,
          updated_at
        FROM conversations
        WHERE uuid = $1
      `;
      const result = await this.databaseService.query(query, [uuid]);
      return result.rows[0];
    })();
    if (!conversation) throw new NotFoundException('Conversation not found');

    const users = await (async () => {
      const query = `
        SELECT 
          u.uuid,
          u.name,
          u.username,
          u.avatar_url,
          uc.role
        FROM user_conversations uc
        JOIN users u
          ON u.id = uc.user_id
        WHERE uc.conversation_id = $1
        ORDER BY uc.created_at
      `;
      const result = await this.databaseService.query(query, [conversation.id]);
      return result.rows;
    })();

    return {
      uuid: conversation.uuid,
      title: conversation.title,
      description: conversation.description,
      thumbnail_url: conversation.thumbnail_url,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      users,
    };
  }

  async findAllParticipantUUIDs(conversationId: string) {
    const query = `
      SELECT u.uuid
      FROM user_conversations uc
      JOIN users u
      ON u.id = uc.user_id
      WHERE uc.conversation_id = $1
    `;
    const result = await this.databaseService.query(query, [conversationId]);
    return result.rows.map((u) => u.uuid);
  }
}
