import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EnvironmentVariables } from 'src/config/env.config';
import { DatabaseService } from 'src/database/database.service';
import { convertTime } from 'src/utlis/time';

import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private databaseService: DatabaseService,
    private configService: ConfigService<EnvironmentVariables>,
  ) {}

  async signUpUserWithLocalStrategy(
    name: string,
    username: string,
    password: string,
  ): Promise<JwtPayload> {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    try {
      const query = `
        INSERT INTO users (name, username, password_hash)
        VALUES ($1, $2, $3)
        RETURNING uuid
      `;
      const values = [name, username, passwordHash];
      const result = await this.databaseService.query(query, values);

      const user = result.rows[0];
      return this.generateTokens(user.uuid);
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint?.includes('username')) {
          throw new ConflictException('Username already exists');
        }
      }
      throw error;
    }
  }

  async signInWithLocalStrategy(
    username: string,
    password: string,
  ): Promise<JwtPayload> {
    const query = `
      SELECT uuid, password_hash 
      FROM users 
      WHERE username = $1
    `;
    const result = await this.databaseService.query(query, [username]);
    const user = result.rows[0];

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.uuid);
  }

  async refreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const query = `SELECT uuid FROM users WHERE uuid = $1`;
      const result = await this.databaseService.query(query, [payload.sub]);
      const user = result.rows[0];

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user.uuid);
    } catch (_error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string): Promise<JwtPayload> {
    const payload = { sub: userId };

    const accessExpiration = this.configService.get('JWT_ACCESS_EXPIRATION');
    const refreshExpiration = this.configService.get('JWT_REFRESH_EXPIRATION');

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: convertTime(accessExpiration).seconds,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: convertTime(refreshExpiration).seconds,
    });

    return {
      ...payload,
      accessToken,
      refreshToken,
    };
  }
}
