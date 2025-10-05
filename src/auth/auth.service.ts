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
import { RedisService } from 'src/redis/redis.service';

import { JwtResponseDto } from './dto/jwt-response-dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private databaseService: DatabaseService,
    private redisService: RedisService,
    private configService: ConfigService<EnvironmentVariables>,
  ) {}

  async signUpUserWithLocalStrategy(
    name: string,
    username: string,
    password: string,
  ): Promise<JwtResponseDto> {
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
  ): Promise<JwtResponseDto> {
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

  async refreshToken(refreshToken: string): Promise<JwtResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const query = `
        SELECT uuid 
        FROM users 
        WHERE uuid = $1
      `;
      const result = await this.databaseService.query(query, [payload.sub]);
      const user = result.rows[0];

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const storedToken = await this.getStoredRefreshToken(
        payload.sub,
        refreshToken,
      );
      if (!storedToken) {
        throw new UnauthorizedException('Refresh token not found');
      }

      return this.generateTokens(user.uuid);
    } catch (_error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string): Promise<JwtResponseDto> {
    const payload = { sub: userId };
    const now = Math.floor(Date.now() / 1000);

    const accessExpiration = this.configService.get('JWT_ACCESS_EXPIRATION');
    const refreshExpiration = this.configService.get('JWT_REFRESH_EXPIRATION');

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessExpiration,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshExpiration,
    });

    await this.storeRefreshToken(userId, refreshToken);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      issuedAt: now,
      expiresAt: now + this.getAccessTokenExpirationSeconds(),
    };
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const key = `refresh_token:${userId}`;
    const expirationInSeconds = this.getRefreshTokenExpirationSeconds();

    await this.redisService.setex(key, expirationInSeconds, refreshToken);
  }

  private getAccessTokenExpirationSeconds(): number {
    const expiration = this.configService.get('JWT_ACCESS_EXPIRATION');
    return this.parseExpirationToSeconds(expiration);
  }

  private getRefreshTokenExpirationSeconds(): number {
    const expiration = this.configService.get('JWT_REFRESH_EXPIRATION');
    return this.parseExpirationToSeconds(expiration);
  }

  private parseExpirationToSeconds(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1));

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900; // 15 minutes default
    }
  }

  private async getStoredRefreshToken(
    userId: string,
    token: string,
  ): Promise<string | null> {
    const key = `refresh_token:${userId}`;
    const storedToken = await this.redisService.get(key);
    return storedToken === token ? storedToken : null;
  }

  async revokeRefreshToken(userId: string): Promise<void> {
    const key = `refresh_token:${userId}`;
    await this.redisService.del(key);
  }

  // Convenience method to support sign-out by userId
  async signOut(userId: string): Promise<void> {
    return this.revokeRefreshToken(userId);
  }

  // Sign-out by providing the refresh token; verifies and revokes it
  async signOutByRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      await this.revokeRefreshToken(payload.sub);
    } catch (_err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
