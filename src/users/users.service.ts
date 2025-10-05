import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryResult } from 'pg';

import { DatabaseService } from '../database/database.service';
import { UserDetail } from './interfaces/user-detail.interface';
import { UserSummary } from './interfaces/user-summary.interface';

@Injectable()
export class UsersService {
  constructor(private databaseService: DatabaseService) {}

  async findAll(): Promise<UserSummary[]> {
    const query = `
      SELECT uuid, name, username, profile_picture_url
      FROM users
      ORDER BY created_at DESC
    `;
    const result: QueryResult<UserSummary> =
      await this.databaseService.query(query);
    return result.rows;
  }

  async findByUuid(uuid: string): Promise<UserDetail> {
    const query = `
      SELECT uuid, name, username, email, phone_number, profile_picture_url, created_at, updated_at
      FROM users
      WHERE uuid = $1
    `;
    const result: QueryResult<UserDetail> = await this.databaseService.query(
      query,
      [uuid],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException('User not found');
    }
    return result.rows[0];
  }

  async findByEmail(email: string): Promise<UserDetail | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result: QueryResult<UserDetail> = await this.databaseService.query(
      query,
      [email],
    );
    return result.rows[0] ?? null;
  }

  async findByUsername(username: string): Promise<UserDetail | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result: QueryResult<UserDetail> = await this.databaseService.query(
      query,
      [username],
    );
    return result.rows[0] ?? null;
  }

  async findByPhone(phoneNumber: string): Promise<UserDetail | null> {
    const query = 'SELECT * FROM users WHERE phone_number = $1';
    const result: QueryResult<UserDetail> = await this.databaseService.query(
      query,
      [phoneNumber],
    );
    return result.rows[0] ?? null;
  }
}
