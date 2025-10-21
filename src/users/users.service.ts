import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { QueryResult } from 'pg';
import { StorageService } from 'src/storage/storage.service';

import { DatabaseService } from '../database/database.service';
import { UserDetail } from './interfaces/user-detail.interface';
import { UserSummary } from './interfaces/user-summary.interface';

@Injectable()
export class UsersService {
  constructor(
    private databaseService: DatabaseService,
    private storageService: StorageService,
  ) {}

  async findAll(): Promise<UserSummary[]> {
    const query = `
      SELECT uuid, name, username, avatar_url
      FROM users
      ORDER BY created_at DESC
    `;
    const result: QueryResult<UserSummary> =
      await this.databaseService.query(query);
    return result.rows;
  }

  async findByUuid(uuid: string): Promise<UserDetail> {
    const query = `
      SELECT uuid, name, username, email, phone_number, avatar_url, created_at, updated_at
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

  async update(
    userUuid: string,
    updates: {
      name?: string;
      username?: string;
      email?: string;
      phone_number?: string;
      oldPassword?: string;
      newPassword?: string;
      avatar?: Buffer;
    },
  ): Promise<UserDetail> {
    const updateFields: Array<[string, string]> = [];

    if (updates.oldPassword && updates.newPassword) {
      const newPasswordHash = await this.updatePassword(
        userUuid,
        updates.oldPassword,
        updates.newPassword,
      );
      updateFields.push(['password_hash', newPasswordHash]);
    }

    if (updates.avatar) {
      const avatarUrl = await this.updateAvatar(userUuid, updates.avatar);
      updateFields.push(['avatar_url', avatarUrl]);
    }

    if (updates.name !== undefined) {
      updateFields.push(['name', updates.name]);
    }

    if (updates.username !== undefined) {
      updateFields.push(['username', updates.username]);
    }

    if (updates.email !== undefined) {
      updateFields.push(['email', updates.email]);
    }

    if (updates.phone_number !== undefined) {
      updateFields.push(['phone_number', updates.phone_number]);
    }

    if (updateFields.length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const setClauses = updateFields.map(
      (field, index) => `${field[0]} = $${index + 1}`,
    );
    const values = updateFields.map(([_, value]) => value);

    const query = `
        UPDATE users
        SET ${setClauses.join(', ')}
        WHERE uuid = $${values.length + 1}
        RETURNING uuid, name, username, email, phone_number, avatar_url, created_at, updated_at
      `;
    const result = await this.databaseService.query(query, [
      ...values,
      userUuid,
    ]);
    return result.rows[0];
  }

  async updatePassword(
    userUuid: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<string> {
    const user = await (async () => {
      const query = `
        SELECT password_hash 
        FROM users 
        WHERE uuid = $1
      `;
      const result = await this.databaseService.query(query, [userUuid]);
      return result.rows[0];
    })();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      user.password_hash,
    );
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await (async () => {
      const query = `
        UPDATE users
        SET password_hash = $1
        WHERE uuid = $2
      `;
      await this.databaseService.query(query, [newPasswordHash, userUuid]);
    });

    return newPasswordHash;
  }

  async updateAvatar(userUuid: string, newAvatar: Buffer): Promise<string> {
    const key = `users/avatars/${userUuid}.png`;
    const url = await this.storageService.uploadFile(
      key,
      newAvatar,
      'image/png',
    );

    return url;
  }
}
