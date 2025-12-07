import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ParamsBuilder } from 'src/database/params-builder';

import { type MessageTable } from './types/message-table';

@Injectable()
export class MessagesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAllDirtyAfterCursorByConversationId<
    const T extends keyof MessageTable,
  >(
    conversationId: number,
    options?: {
      cursor?: {
        version: string;
        oldestMessageId: number | null;
      };
      limit?: number;
      fields?: T[];
    },
  ) {
    const builder = new ParamsBuilder([conversationId]);

    const cursorCondition = options?.cursor
      ? `
          AND version > ${builder.push(options.cursor.version)}
          AND id >= ${builder.push(options.cursor.oldestMessageId)}
        `
      : '';
    const limitClause = options?.limit
      ? `
          LIMIT ${builder.push(options.limit)}
        `
      : '';

    const params = builder.getParams();

    if (!options?.fields?.length) {
      const query = `
        SELECT COUNT(1)
        FROM messages
        WHERE conversation_id = $1
          ${cursorCondition}
        ORDER BY version
        ${limitClause}
      `;

      const result = await this.databaseService.query<{ count: string }>(
        query,
        params,
      );
      return Array.from(
        { length: Number(result.rows[0].count) },
        () => ({}) as Pick<MessageTable, T>,
      );
    }

    const columns = options?.fields ? options.fields.join(', ') : '*';

    const query = `
      SELECT ${columns}
      FROM messages
      WHERE conversation_id = $1
        ${cursorCondition}
      ORDER BY version
      ${limitClause}
    `;

    const result = await this.databaseService.query<Pick<MessageTable, T>>(
      query,
      params,
    );

    return result.rows;
  }

  async findAllBeforeCursorByConversationId<const T extends keyof MessageTable>(
    conversationId: number,
    options?: {
      cursor?: { messageId: number };
      limit?: number;
      fields?: T[];
    },
  ) {
    const builder = new ParamsBuilder([conversationId]);

    const cursorCondition = options?.cursor
      ? `
          AND id < ${builder.push(options.cursor.messageId)}
        `
      : '';
    const limitClause = options?.limit
      ? `
          LIMIT ${builder.push(options.limit)}
        `
      : '';

    const params = builder.getParams();

    if (!options?.fields?.length) {
      const query = `
        SELECT COUNT(1) as count
        FROM messages
        WHERE conversation_id = $1
          ${cursorCondition}
        ORDER BY id DESC
        ${limitClause}
      `;

      const result = await this.databaseService.query<{ count: string }>(
        query,
        params,
      );
      return Array.from(
        { length: Number(result.rows[0].count) },
        () => ({}) as Pick<MessageTable, T>,
      );
    }

    const columns = options.fields.join(', ');

    const query = `
      SELECT ${columns}
      FROM messages
      WHERE conversation_id = $1
        ${cursorCondition}
      ORDER BY id DESC
      ${limitClause}
    `;

    const result = await this.databaseService.query<Pick<MessageTable, T>>(
      query,
      params,
    );

    return result.rows;
  }

  async findAllLatestPerConversationByUserId<
    const T extends keyof MessageTable,
  >(userId: number, options?: { fields?: T[] }) {
    const params: unknown[] = [userId];

    if (!options?.fields?.length) {
      const query = `
        SELECT COUNT(1) as count
        FROM user_conversations uc
        WHERE uc.user_id = $1
      `;

      const result = await this.databaseService.query<{ count: string }>(
        query,
        params,
      );
      return Array.from(
        { length: Number(result.rows[0].count) },
        () => ({}) as Pick<MessageTable, T>,
      );
    }

    const columns = options?.fields
      ? options.fields.map((f) => `m.${f}`).join(', ')
      : 'm.*';
    const subcolumns = options?.fields ? options.fields.join(', ') : '*';

    const query = `
      SELECT ${columns}
      FROM user_conversations uc
      JOIN LATERAL (
        SELECT ${subcolumns}
        FROM messages
        WHERE conversation_id = uc.conversation_id
        ORDER BY id DESC
        LIMIT 1
      ) m ON TRUE
      WHERE uc.user_id = $1
    `;

    const result = await this.databaseService.query<Pick<MessageTable, T>>(
      query,
      params,
    );

    return result.rows;
  }

  async findOneBy<
    const K extends 'id' | 'uuid',
    const T extends keyof MessageTable,
  >(
    key: K,
    value: MessageTable[K],
    options?: { fields?: T[]; deleted?: boolean },
  ) {
    let deletedCondition = '';
    if (options?.deleted !== undefined) {
      deletedCondition = `AND deleted_at IS ${options.deleted ? 'NOT NULL' : 'NULL'}`;
    }

    if (!options?.fields?.length) {
      const query = `
        SELECT 1
        FROM messages
        WHERE ${key} = $1
          ${deletedCondition}
        LIMIT 1
      `;

      const result = await this.databaseService.query(query, [value]);

      return result.rows.at(0) ? ({} as Pick<MessageTable, T>) : null;
    }

    const columns = options?.fields ? options.fields.join(', ') : '*';

    const query = `
      SELECT ${columns}
      FROM messages
      WHERE ${key} = $1
        ${deletedCondition}
      LIMIT 1
    `;

    const result = await this.databaseService.query<Pick<MessageTable, T>>(
      query,
      [value],
    );

    return result.rows.at(0) ?? null;
  }

  async createOne<const T extends keyof MessageTable>(
    data: Pick<MessageTable, 'user_id' | 'conversation_id' | 'content'>,
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
      INSERT INTO messages (${entryKeys})
      VALUES (${params})
      ${returningClause}
    `;

    const result = await this.databaseService.query<Pick<MessageTable, T>>(
      query,
      values,
    );

    return result.rows.at(0) ?? ({} as Pick<MessageTable, T>);
  }

  async updateOneBy<
    const K extends 'id' | 'uuid',
    const T extends keyof MessageTable,
  >(
    key: K,
    value: MessageTable[K],
    data: Partial<Pick<MessageTable, 'content'>>,
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
        UPDATE messages
        SET ${setClause}
        WHERE ${key} = $1
          ${deletedCondition}
        RETURNING 1
      `;

      const result = await this.databaseService.query(query, values);
      return result.rows.at(0) ? ({} as Pick<MessageTable, T>) : null;
    }

    const columns = options?.fields ? options.fields.join(', ') : '*';

    let returningClause = '';
    if (columns) {
      returningClause = `RETURNING ${columns}`;
    }

    const query = `
      UPDATE messages
      SET ${setClause}
      WHERE ${key} = $1
        ${deletedCondition}
      ${returningClause}
    `;

    const result = await this.databaseService.query<Pick<MessageTable, T>>(
      query,
      values,
    );

    return (
      result.rows.at(0) ?? (columns ? null : ({} as Pick<MessageTable, T>))
    );
  }
}
