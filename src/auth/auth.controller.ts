import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { convertTime } from 'src/utlis/time';

import { AuthService } from './auth.service';
import { SignUpWithLocalStrategyRequestDto } from './dto/sign-up-with-local-strategy-request.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { EnvironmentVariables } from '../config/env.config';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService<EnvironmentVariables>,
  ) {}

  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const accessTokenExpiration = this.configService.get(
      'JWT_ACCESS_EXPIRATION',
    );
    const refreshTokenExpiration = this.configService.get(
      'JWT_REFRESH_EXPIRATION',
    );
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    const accessTokenMaxAge = convertTime(accessTokenExpiration).milliseconds;
    const refreshTokenMaxAge = convertTime(refreshTokenExpiration).milliseconds;

    response.cookie('access_token', accessToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProduction,
      maxAge: accessTokenMaxAge,
    });

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProduction,
      maxAge: refreshTokenMaxAge,
    });
  }

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  async signUpWithLocalStrategy(
    @Body() { name, username, password }: SignUpWithLocalStrategyRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Pick<JwtPayload, 'sub'>> {
    const { sub, accessToken, refreshToken } =
      await this.authService.signUpUserWithLocalStrategy(
        name,
        username,
        password,
      );

    this.setAuthCookies(response, accessToken, refreshToken);

    return { sub };
  }

  @Post('sign-in')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async signInWithLocalStrategy(
    @Request() authRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Pick<JwtPayload, 'sub'>> {
    const { sub, accessToken, refreshToken } = authRequest.user;

    this.setAuthCookies(response, accessToken, refreshToken);

    return { sub };
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.OK)
  async signOut(@Res({ passthrough: true }) response: Response): Promise<void> {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Request() req,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Pick<JwtPayload, 'sub'>> {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const {
      sub,
      accessToken,
      refreshToken: newRefreshToken,
    } = await this.authService.refreshToken(refreshToken);

    this.setAuthCookies(response, accessToken, newRefreshToken);

    return { sub };
  }
}
