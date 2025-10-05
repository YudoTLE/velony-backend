import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

import { AuthService } from './auth.service';
import { JwtResponseDto } from './dto/jwt-response-dto';
import { SignInWithLocalStrategyRequestDto } from './dto/sign-in-with-local-strategy-request.dto';
import { SignUpWithLocalStrategyRequestDto } from './dto/sign-up-with-local-strategy-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  async signUpWithLocalStrategy(
    @Body()
    registerDto: SignUpWithLocalStrategyRequestDto,
  ): Promise<JwtResponseDto> {
    const { name, username, password } = registerDto;

    return this.authService.signUpUserWithLocalStrategy(
      name,
      username,
      password,
    );
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signInWithLocalStrategy(
    @Body()
    loginDto: SignInWithLocalStrategyRequestDto,
  ): Promise<JwtResponseDto> {
    const { username, password } = loginDto;

    return this.authService.signInWithLocalStrategy(username, password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<JwtResponseDto> {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.OK)
  async signOut(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ success: true }> {
    await this.authService.signOutByRefreshToken(refreshToken);
    return { success: true };
  }
}
