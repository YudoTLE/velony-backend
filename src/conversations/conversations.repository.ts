import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { type UserTable } from 'src/users/types/user-table';

import { type ConversationTable } from './types/conversation-table';

@Injectable()
export class ConversationsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAllDirtyAfterCursorByUserId<
    const T extends keyof ConversationTable,
  >(
    userId: UserTable['id'],
    options?: {
      fields?: T[];
      cursor?: { updatedAt: Date; conversationId: number };
      limit?: number;
    },
  ) {
    const params: unknown[] = [userId];
    let paramIndex = 2;

    let cursorCondition = '';
    if (options?.cursor !== undefined) {
      cursorCondition = `AND (c.updated_at, c.id) > ($${paramIndex++}, $${paramIndex++})`;
      params.push(options.cursor.updatedAt);
      params.push(options.cursor.conversationId);
    }

    let limitClause = '';
    if (options?.limit != undefined) {
      limitClause = `LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }

    if (!options?.fields?.length) {
      const query = `
        SELECT COUNT(1)
        FROM user_conversations uc
        JOIN conversations c
          ON c.id = uc.conversation_id
        WHERE uc.user_id = $1
          ${cursorCondition}
        ${limitClause}
      `;

      const result = await this.databaseService.query<{ count: string }>(
        query,
        params,
      );
      return Array.from(
        { length: Number(result.rows[0].count) },
        () => ({}) as Pick<ConversationTable, T>,
      );
    }

    const columns = options.fields.map((field) => `c.${field}`).join(', ');

    const query = `
      SELECT ${columns}
      FROM user_conversations uc
      JOIN conversations c
        ON c.id = uc.conversation_id
      WHERE uc.user_id = $1
        ${cursorCondition}
      ${limitClause}
    `;

    const result = await this.databaseService.query<Pick<ConversationTable, T>>(
      query,
      params,
    );
    return result.rows;
  }

  async findOneBy<
    const K extends 'id' | 'uuid',
    const T extends keyof ConversationTable,
  >(
    key: K,
    value: ConversationTable[K],
    options?: { fields?: T[]; deleted?: boolean },
  ) {
    let deletedCondition = '';
    if (options?.deleted !== undefined) {
      deletedCondition = `AND deleted_at IS ${options.deleted ? 'NOT NULL' : 'NULL'}`;
    }

    if (!options?.fields?.length) {
      const query = `
        SELECT 1
        FROM conversations
        WHERE ${key} = $1
          ${deletedCondition}
        LIMIT 1
      `;

      const result = await this.databaseService.query(query, [value]);

      return result.rows.at(0) ? ({} as Pick<ConversationTable, T>) : null;
    }

    const columns = options?.fields ? options.fields.join(', ') : '*';

    const query = `
      SELECT ${columns}
      FROM conversations
      WHERE ${key} = $1
        ${deletedCondition}
      LIMIT 1
    `;

    const result = await this.databaseService.query<Pick<ConversationTable, T>>(
      query,
      [value],
    );

    return result.rows.at(0) ?? null;
  }

  async createOne<const T extends keyof ConversationTable>(
    data: Pick<ConversationTable, 'title' | 'description'> &
      Partial<Pick<ConversationTable, 'thumbnail_url'>>,
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
      INSERT INTO conversations (${entryKeys})
      VALUES (${params})
      ${returningClause}
    `;

    const result = await this.databaseService.query<Pick<ConversationTable, T>>(
      query,
      values,
    );

    return result.rows.at(0) ?? ({} as Pick<ConversationTable, T>);
  }

  async updateOneBy<
    const K extends 'id' | 'uuid',
    const T extends keyof ConversationTable,
  >(
    key: K,
    value: ConversationTable[K],
    data: Partial<
      Omit<
        ConversationTable,
        'id' | 'uuid' | 'created_at' | 'updated_at' | 'deleted_at'
      >
    >,
    options?: {
      fields?: T[];
      deleted?: boolean;
    },
  ) {
    if (Object.keys(data).length === 0) {
      return this.findOneBy(key, value, options);
    }

    const entries = Object.entries(data);

    const setClause = entries
      .map(([column], i) => `${column} = $${i + 2}`)
      .join(', ');

    const values = [value, ...entries.map(([, v]) => v)];

    let deletedCondition = '';
    if (options?.deleted !== undefined) {
      deletedCondition = `AND deleted_at IS ${options.deleted ? 'NOT NULL' : 'NULL'}`;
    }

    if (!options?.fields?.length) {
      const query = `
        UPDATE conversations
        SET ${setClause}
        WHERE ${key} = $1
          ${deletedCondition}
        RETURNING 1
      `;

      const result = await this.databaseService.query(query, values);
      return result.rows.at(0) ? ({} as Pick<ConversationTable, T>) : null;
    }

    const columns = options?.fields ? options.fields.join(', ') : '*';

    let returningClause = '';
    if (columns) {
      returningClause = `RETURNING ${columns}`;
    }

    const query = `
      UPDATE conversations
      SET ${setClause}
      WHERE ${key} = $1
        ${deletedCondition}
      ${returningClause}
    `;

    const result = await this.databaseService.query<Pick<ConversationTable, T>>(
      query,
      values,
    );

    return (
      result.rows.at(0) ?? (columns ? null : ({} as Pick<ConversationTable, T>))
    );
  }
}
