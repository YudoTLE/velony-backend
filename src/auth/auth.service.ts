import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { EnvironmentVariables } from 'src/config/env.config';
import { InvalidCredentialsException } from 'src/common/exceptions/invalid-credentials.exception';
import { InvalidTokenException } from 'src/common/exceptions/invalid-token.exception';
import { UsernameAlreadyExistsException } from 'src/common/exceptions/username-already-exists.exception';
import { UsersRepository } from 'src/users/users.repository';
import { convertTime } from 'src/utlis/time';

import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly usersRepository: UsersRepository,
  ) {}

  async signUpUserWithLocalStrategy(
    name: string,
    username: string,
    password: string,
  ): Promise<JwtPayload> {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    try {
      const newUserUuid = await this.usersRepository
        .createOne(
          { name, username, password_hash: passwordHash },
          { fields: ['uuid'] },
        )
        .then((u) => u.uuid);

      return this.generateTokens(newUserUuid);
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint?.includes('username')) {
          throw new UsernameAlreadyExistsException();
        }
      }
      throw error;
    }
  }

  async signInWithLocalStrategy(
    username: string,
    password: string,
  ): Promise<JwtPayload> {
    const user = await this.usersRepository.findOneBy('username', username, {
      fields: ['uuid', 'password_hash'],
    });
    if (!user || !user.password_hash) {
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    return this.generateTokens(user.uuid);
  }

  async refreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const user = await this.usersRepository.findOneBy('uuid', payload.sub, {
        fields: ['id'],
      });
      if (!user) throw new InvalidTokenException();

      return this.generateTokens(payload.sub);
    } catch (_error) {
      throw new InvalidTokenException();
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
