import {
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

  async updateUsername(userUuid: string, newUsername: string): Promise<string> {
    await (async () => {
      const query = `
        UPDATE users
        SET username = $1
        WHERE uuid = $2
      `;
      await this.databaseService.query(query, [newUsername, userUuid]);
    })();

    return newUsername;
  }

  async updateName(userUuid: string, newName: string): Promise<string> {
    await (async () => {
      const query = `
        UPDATE users
        SET name = $1
        WHERE uuid = $2
      `;
      await this.databaseService.query(query, [newName, userUuid]);
    })();

    return newName;
  }

  async updateEmail(userUuid: string, newEmail: string): Promise<string> {
    await (async () => {
      const query = `
        UPDATE users
        SET email = $1
        WHERE uuid = $2
      `;
      await this.databaseService.query(query, [newEmail, userUuid]);
    })();

    return newEmail;
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
    })();

    return newPasswordHash;
  }

  async updateAvatar(userUuid: string, newAvatar: Buffer): Promise<string> {
    const key = `users/avatars/${userUuid}.png`;
    const url = await this.storageService.uploadFile(
      key,
      newAvatar,
      'image/png',
    );

    await (async () => {
      const query = `
        UPDATE users
        SET avatar_url = $1
        WHERE uuid = $2
      `;
      await this.databaseService.query(query, [url, userUuid]);
    })();

    return url;
  }
}
