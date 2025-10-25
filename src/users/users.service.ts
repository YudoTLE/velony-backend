import crypto from 'crypto';

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { QueryResult } from 'pg';
import { MailService } from 'src/mail/mail.service';
import { StorageService } from 'src/storage/storage.service';
import { convertTime } from 'src/utlis/time';

import { DatabaseService } from '../database/database.service';
import { UserDetail } from './interfaces/user-detail.interface';
import { UserSummary } from './interfaces/user-summary.interface';

@Injectable()
export class UsersService {
  constructor(
    private mailService: MailService,
    private databaseService: DatabaseService,
    private storageService: StorageService,
    private configService: ConfigService,
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
      this.updateEmail(userUuid, updates.email);
    }

    if (updates.phone_number !== undefined) {
      updateFields.push(['phone_number', updates.phone_number]);
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

  async updateEmail(userUuid: string, newEmail: string): Promise<void> {
    const user = await (async () => {
      const query = `
        SELECT id, name
        FROM users
        WHERE uuid = $1
      `;
      const result = await this.databaseService.query(query, [userUuid]);
      return result.rows[0];
    })();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const expiration = convertTime(
      this.configService.getOrThrow('EMAIL_TOKEN_EXPIRATION'),
    );
    const otp = Array.from({ length: 6 }, () => crypto.randomInt(0, 10)).join(
      '',
    );
    const email = {
      to: newEmail,
      subject: 'Verify your email for VelonY',
      html: this.mailService.loadTemplate('verify-email.html', {
        name: user.name,
        otp: otp,
        expires: `${expiration.minutes} minutes`,
      }),
    };

    await (async () => {
      const query = `
        INSERT INTO verifications (user_id, type, value, code, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, type)
        WHERE verified_at IS NULL
        DO UPDATE
          SET value = EXCLUDED.value,
              code = EXCLUDED.code,
              expires_at = EXCLUDED.expires_at,
              initiated_at = now();
      `;
      await this.databaseService.query(query, [
        user.id,
        'email',
        newEmail,
        otp,
        new Date(Date.now() + expiration.milliseconds),
      ]);
    })();

    await this.mailService.sendEmail(email);
  }

  async verifyEmail(userUuid: string, otp: string): Promise<string> {
    const user = await (async () => {
      const query = `
      SELECT id
      FROM users
      WHERE uuid = $1
    `;
      const result = await this.databaseService.query(query, [userUuid]);
      return result.rows[0];
    })();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const verification = await (async () => {
      const query = `
        SELECT id, value, code, expires_at
        FROM verifications
        WHERE user_id = $1
          AND type = $2
          AND verified_at IS NULL
      `;
      const result = await this.databaseService.query(query, [
        user.id,
        'email',
      ]);
      return result.rows[0];
    })();
    if (!verification) {
      throw new NotFoundException('No pending email verification found');
    }

    if (new Date() > new Date(verification.expires_at)) {
      throw new BadRequestException('Verification code has expired');
    }

    if (verification.code !== otp) {
      throw new BadRequestException('Invalid verification code');
    }

    await (async () => {
      const query = `
        UPDATE users
        SET email = $1
        WHERE id = $2
      `;
      await this.databaseService.query(query, [verification.value, user.id]);
    })();

    await (async () => {
      const query = `
        UPDATE verifications
        SET verified_at = now()
        WHERE id = $1
      `;
      await this.databaseService.query(query, [verification.id]);
    })();

    return verification.value;
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
