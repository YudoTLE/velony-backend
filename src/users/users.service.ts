import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';

import { CreateUserWithUsernameRequestDto } from './dto/create-user-with-username-request.dto';
import { UserDetailResponseDto } from './dto/user-detail-response.dto';
import { UserSummaryResponseDto } from './dto/user-summary-response.dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private databaseService: DatabaseService) {}

  async createUserWithUsername(
    createUserDto: CreateUserWithUsernameRequestDto,
  ): Promise<UserDetailResponseDto> {
    const { name, username, password } = createUserDto;

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    try {
      const query = `
        INSERT INTO users (name, username, password_hash)
        VALUES ($1, $2, $3)
        RETURNING uuid, name, username, email, phone_number, profile_picture_url, created_at, updated_at
      `;
      const values = [name, username, passwordHash];
      const result = await this.databaseService.query(query, values);

      return plainToInstance(UserDetailResponseDto, result.rows[0]);
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint?.includes('username')) {
          throw new ConflictException('Username already exists');
        }
      }
      throw error;
    }
  }

  async findAll(): Promise<UserSummaryResponseDto[]> {
    const query =
      'SELECT uuid, name, username, profile_picture_url FROM users ORDER BY created_at DESC';
    const result = await this.databaseService.query(query);
    return result.rows.map((row) =>
      plainToInstance(UserSummaryResponseDto, row),
    );
  }

  async findByUuid(uuid: string): Promise<UserDetailResponseDto> {
    const query =
      'SELECT uuid, name, username, email, phone_number, profile_picture_url, created_at, updated_at FROM users WHERE uuid = $1';
    const result = await this.databaseService.query(query, [uuid]);

    if (result.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    return plainToInstance(UserDetailResponseDto, result.rows[0]);
  }

  // Helper methods for finding users (optional)
  async findByEmail(email: string): Promise<UserDetailResponseDto | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.databaseService.query(query, [email]);
    return result.rows[0]
      ? plainToInstance(UserDetailResponseDto, result.rows[0])
      : null;
  }

  async findByUsername(
    username: string,
  ): Promise<UserDetailResponseDto | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await this.databaseService.query(query, [username]);
    return result.rows[0]
      ? plainToInstance(UserDetailResponseDto, result.rows[0])
      : null;
  }

  async findByPhone(
    phoneNumber: string,
  ): Promise<UserDetailResponseDto | null> {
    const query = 'SELECT * FROM users WHERE phone_number = $1';
    const result = await this.databaseService.query(query, [phoneNumber]);
    return result.rows[0]
      ? plainToInstance(UserDetailResponseDto, result.rows[0])
      : null;
  }

  // Utility method for authentication
  async validatePassword(
    passwordHash: string | null,
    password: string,
  ): Promise<boolean> {
    if (!passwordHash) return false;
    return bcrypt.compare(password, passwordHash);
  }
}
