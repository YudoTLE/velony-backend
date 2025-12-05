import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

import { type UserConversationTable } from './types/user-conversation-table';

@Injectable()
export class UserConversationsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findOne<const T extends keyof UserConversationTable>(
    id: { userId: number; conversationId: number },
    options?: { fields?: T[]; deleted?: boolean },
  ) {
    let deletedCondition = '';
    if (options?.deleted !== undefined) {
      deletedCondition = `AND deleted_at IS ${options.deleted ? 'NOT NULL' : 'NULL'}`;
    }

    if (!options?.fields?.length) {
      const query = `
        SELECT 1
        FROM user_conversations
        WHERE user_id = $1 AND conversation_id = $2
          ${deletedCondition}
        LIMIT 1
      `;

      const result = await this.databaseService.query(query, [
        id.userId,
        id.conversationId,
      ]);

      return result.rows.at(0) ? ({} as Pick<UserConversationTable, T>) : null;
    }

    const columns = options?.fields ? options.fields.join(', ') : '*';

    const query = `
      SELECT ${columns}
      FROM user_conversations
      WHERE user_id = $1 AND conversation_id = $2
        ${deletedCondition}
      LIMIT 1
    `;

    const result = await this.databaseService.query<
      Pick<UserConversationTable, T>
    >(query, [id.userId, id.conversationId]);

    return result.rows.at(0) ?? null;
  }

  async createOne<const T extends keyof UserConversationTable>(
    data: Pick<UserConversationTable, 'user_id' | 'conversation_id' | 'role'>,
    options?: { fields?: T[] },
  ) {
    const entries = Object.entries(data);

    const entryKeys = entries.map(([key]) => key).join(', ');
    const params = entries.map((_, i) => `$${i + 1}`).join(', ');
    const values = entries.map(([, v]) => v);

    const columns = options?.fields ? options.fields.join(', ') : '*';

    let returningClause = '';
    if (columns) {
      returningClause = `RETURNING ${columns}`;
    }

    const query = `
      INSERT INTO user_conversations (${entryKeys})
      VALUES (${params})
      ${returningClause}
    `;

    const result = await this.databaseService.query<
      Pick<UserConversationTable, T>
    >(query, values);

    return result.rows.at(0) ?? ({} as Pick<UserConversationTable, T>);
  }
}
