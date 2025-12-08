import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ParamsBuilder } from 'src/database/params-builder';

import { type UserTable } from './types/user-table';

@Injectable()
export class UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll<const T extends keyof UserTable>(options?: { fields?: T[] }) {
    if (!options?.fields?.length) {
      const query = `
        SELECT COUNT(1)
        FROM users
      `;

      const result = await this.databaseService.query<{ count: string }>(query);
      return Array.from(
        { length: Number(result.rows[0].count) },
        () => ({}) as Pick<UserTable, T>,
      );
    }

    const columns = options.fields.join(', ');

    const query = `
      SELECT ${columns}
      FROM users
      ORDER BY created_at DESC
    `;

    const result = await this.databaseService.query<Pick<UserTable, T>>(query);
    return result.rows;
  }

  async findAllDirtyAfterCursorByConversationId<
    const T extends keyof UserTable,
  >(
    conversationId: number,
    options?: {
      cursor?: {
        version: string;
      };
      limit?: number;
      fields?: T[];
    },
  ) {
    const builder = new ParamsBuilder([conversationId]);

    const cursorCondition = options?.cursor
      ? `
          AND u.version > ${options.cursor.version}
        `
      : '';
    const limitClause = options?.limit
      ? `
          LIMIT ${options.limit}
        `
      : '';

    const params = builder.getParams();

    if (!options?.fields?.length) {
      const query = `
        SELECT COUNT(1)
        FROM user_conversations uc
        JOIN users u
          ON u.id = uc.user_id
        WHERE uc.conversation_id = $1
          AND uc.deleted_at IS NULL
          ${cursorCondition}
        ORDER BY u.version
        ${limitClause}
      `;

      const result = await this.databaseService.query<{ count: string }>(
        query,
        params,
      );
      return Array.from(
        { length: Number(result.rows[0].count) },
        () => ({}) as Pick<UserTable, T>,
      );
    }

    const columns = options?.fields
      ? options.fields.map((field) => `u.${field}`).join(', ')
      : '*';

    const query = `
      SELECT ${columns}
      FROM user_conversations uc
      JOIN users u
        ON u.id = uc.user_id
      WHERE uc.conversation_id = $1
        ${cursorCondition}
      ORDER BY u.version
      ${limitClause}
    `;

    const result = await this.databaseService.query<Pick<UserTable, T>>(
      query,
      params,
    );

    return result.rows;
  }

  async findOneBy<
    const K extends 'id' | 'uuid' | 'username',
    const T extends keyof UserTable,
  >(
    key: K,
    value: UserTable[K],
    options?: { fields?: T[]; deleted?: boolean },
  ) {
    let deletedCondition = '';
    if (options?.deleted !== undefined) {
      deletedCondition = `AND deleted_at IS ${options.deleted ? 'NOT NULL' : 'NULL'}`;
    }

    if (!options?.fields?.length) {
      const query = `
        SELECT 1
        FROM users
        WHERE ${key} = $1
          ${deletedCondition}
        LIMIT 1
      `;

      const result = await this.databaseService.query(query, [value]);

      return result.rows.at(0) ? ({} as Pick<UserTable, T>) : null;
    }

    const columns = options?.fields ? options.fields.join(', ') : '*';

    const query = `
      SELECT ${columns}
      FROM users
      WHERE ${key} = $1
        ${deletedCondition}
      LIMIT 1
    `;

    const result = await this.databaseService.query<Pick<UserTable, T>>(query, [
      value,
    ]);

    return result.rows.at(0) ?? null;
  }

  async findAllByConversationId<const T extends keyof UserTable>(
    id: number,
    options?: { fields?: T[] },
  ) {
    if (!options?.fields?.length) {
      const query = `
        SELECT COUNT(1)
        FROM user_conversations uc
        WHERE uc.conversation_id = $1
      `;

      const result = await this.databaseService.query<{ count: string }>(
        query,
        [id],
      );
      return Array.from(
        { length: Number(result.rows[0].count) },
        () => ({}) as Pick<UserTable, T>,
      );
    }

    const columns = options.fields.map((field) => `u.${field}`).join(', ');

    const query = `
      SELECT ${columns}
      FROM user_conversations uc
      JOIN users u
        ON u.id = uc.user_id
      WHERE uc.conversation_id = $1
    `;

    const result = await this.databaseService.query<Pick<UserTable, T>>(query, [
      id,
    ]);

    return result.rows;
  }

  async findAllBy<
    const K extends 'ids' | 'uuids' | 'usernames',
    const T extends keyof UserTable,
  >(
    key: K,
    values: UserTable[K extends `${infer S}s` ? S : K][],
    options?: {
      fields?: T[];
      deleted?: boolean;
    },
  ) {
    let deletedCondition = '';
    if (options?.deleted !== undefined) {
      deletedCondition = `AND deleted_at IS ${options.deleted ? 'NOT NULL' : 'NULL'}`;
    }

    if (!options?.fields?.length) {
      const query = `
        SELECT COUNT(1)
        FROM users
        WHERE ${key.slice(0, -1)} = ANY($1)
          ${deletedCondition}
      `;

      const result = await this.databaseService.query<{ count: string }>(
        query,
        [values],
      );
      return Array.from(
        { length: Number(result.rows[0].count) },
        () => ({}) as Pick<UserTable, T>,
      );
    }

    const columns = options.fields ? options.fields.join(', ') : '*';

    const query = `
      SELECT ${columns}
      FROM users
      WHERE ${key.slice(0, -1)} = ANY($1)
        ${deletedCondition}
    `;

    const result = await this.databaseService.query<Pick<UserTable, T>>(query, [
      values,
    ]);

    return result.rows;
  }

  async createOne<const T extends keyof UserTable>(
    data: Pick<UserTable, 'name' | 'username'> &
      Partial<
        Pick<
          UserTable,
          'email' | 'password_hash' | 'phone_number' | 'avatar_url'
        >
      >,
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
      INSERT INTO users (${entryKeys})
      VALUES (${params})
      ${returningClause}
    `;

    const result = await this.databaseService.query<Pick<UserTable, T>>(
      query,
      values,
    );

    return result.rows.at(0) ?? ({} as Pick<UserTable, T>);
  }

  async updateOneBy<
    const K extends 'id' | 'uuid',
    const T extends keyof UserTable,
  >(
    key: K,
    value: UserTable[K],
    data: Partial<Omit<UserTable, 'id' | 'uuid' | 'created_at' | 'updated_at'>>,
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
        UPDATE users
        SET ${setClause}
        WHERE ${key} = $1
          ${deletedCondition}
        RETURNING 1
      `;

      const result = await this.databaseService.query(query, values);
      return result.rows.at(0) ? ({} as Pick<UserTable, T>) : null;
    }

    const columns = options?.fields ? options.fields.join(', ') : '*';

    let returningClause = '';
    if (columns) {
      returningClause = `RETURNING ${columns}`;
    }

    const query = `
      UPDATE users
      SET ${setClause}
      WHERE ${key} = $1
        ${deletedCondition}
      ${returningClause}
    `;

    const result = await this.databaseService.query<Pick<UserTable, T>>(
      query,
      values,
    );

    return result.rows.at(0) ?? (columns ? null : ({} as Pick<UserTable, T>));
  }
}
