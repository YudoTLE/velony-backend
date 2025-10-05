import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvironmentVariables } from 'src/config/env.config';

import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtCookieStrategy extends PassportStrategy(
  Strategy,
  'jwt-cookie',
) {
  constructor(configService: ConfigService<EnvironmentVariables>) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET')!;

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => request?.cookies?.access_token,
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate({
    sub,
  }: Pick<JwtPayload, 'sub'>): Promise<Pick<JwtPayload, 'sub'>> {
    return { sub };
  }
}
