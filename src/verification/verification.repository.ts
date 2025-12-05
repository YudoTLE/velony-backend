import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

import { type VerificationTable } from './types/verification-table';

@Injectable()
export class VerificationRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findOneBy<
    const K extends 'id' | 'user_id',
    const T extends keyof VerificationTable,
  >(
    key: K,
    value: VerificationTable[K],
    options?: {
      type?: string;
      verified?: boolean;
      fields?: T[];
    },
  ) {
    const params: unknown[] = [value];
    let paramIndex = 2;

    let typeCondition = '';
    if (options?.type !== undefined) {
      typeCondition = `AND type = $${paramIndex++}`;
      params.push(options.type);
    }

    let verifiedCondition = '';
    if (options?.verified !== undefined) {
      verifiedCondition = `AND verified_at IS ${options.verified ? 'NOT NULL' : 'NULL'}`;
    }

    if (!options?.fields?.length) {
      const query = `
        SELECT 1
        FROM verifications
        WHERE ${key} = $1
          ${typeCondition}
          ${verifiedCondition}
        LIMIT 1
      `;

      const result = await this.databaseService.query(query, params);
      return result.rows.at(0) ? ({} as Pick<VerificationTable, T>) : null;
    }

    const columns = options.fields.join(', ');

    const query = `
      SELECT ${columns}
      FROM verifications
      WHERE ${key} = $1
        ${typeCondition}
        ${verifiedCondition}
      LIMIT 1
    `;

    const result = await this.databaseService.query<Pick<VerificationTable, T>>(
      query,
      params,
    );

    return result.rows.at(0) ?? null;
  }

  async createOne<const T extends keyof VerificationTable>(
    data: Pick<
      VerificationTable,
      'user_id' | 'type' | 'value' | 'code' | 'expires_at'
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
      INSERT INTO verifications (${entryKeys})
      VALUES (${params})
      ON CONFLICT (user_id, type)
      WHERE verified_at IS NULL
      DO UPDATE
        SET value = EXCLUDED.value,
            code = EXCLUDED.code,
            expires_at = EXCLUDED.expires_at,
            initiated_at = now()
      ${returningClause}
    `;

    const result = await this.databaseService.query<Pick<VerificationTable, T>>(
      query,
      values,
    );

    return result.rows.at(0) ?? ({} as Pick<VerificationTable, T>);
  }

  async updateOneBy<
    const K extends 'id' | 'user_id',
    const T extends keyof VerificationTable,
  >(
    key: K,
    value: VerificationTable[K],
    data: Partial<Pick<VerificationTable, 'verified_at'>>,
    options?: {
      type?: string;
      verified?: boolean;
      fields?: T[];
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
    let paramIndex = entries.length + 2;

    const params: unknown[] = values;

    let typeCondition = '';
    if (options?.type !== undefined) {
      typeCondition = `AND type = $${paramIndex++}`;
      params.push(options.type);
    }

    let verifiedCondition = '';
    if (options?.verified !== undefined) {
      verifiedCondition = `AND verified_at IS ${options.verified ? 'NOT NULL' : 'NULL'}`;
    }

    if (!options?.fields?.length) {
      const query = `
        UPDATE verifications
        SET ${setClause}
        WHERE ${key} = $1
          ${typeCondition}
          ${verifiedCondition}
        RETURNING 1
      `;

      const result = await this.databaseService.query(query, params);
      return result.rows.at(0) ? ({} as Pick<VerificationTable, T>) : null;
    }

    const columns = options.fields.join(', ');

    let returningClause = '';
    if (columns) {
      returningClause = `RETURNING ${columns}`;
    }

    const query = `
      UPDATE verifications
      SET ${setClause}
      WHERE ${key} = $1
        ${typeCondition}
        ${verifiedCondition}
      ${returningClause}
    `;

    const result = await this.databaseService.query<Pick<VerificationTable, T>>(
      query,
      params,
    );

    return (
      result.rows.at(0) ?? (columns ? null : ({} as Pick<VerificationTable, T>))
    );
  }
}
