import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

import { AuthService } from './auth.service';
import { JwtResponseDto } from './dto/jwt-response-dto';
import { LoginWithLocalStrategyRequestDto } from './dto/login-with-local-strategy-request.dto';
import { RegisterWithLocalStrategyRequestDto } from './dto/register-with-local-strategy-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerWithLocalStrategy(
    @Body()
    registerDto: RegisterWithLocalStrategyRequestDto,
  ): Promise<JwtResponseDto> {
    const { name, username, password } = registerDto;

    return this.authService.registerUserWithLocalStrategy(
      name,
      username,
      password,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginWithLocalStrategy(
    @Body()
    loginDto: LoginWithLocalStrategyRequestDto,
  ): Promise<JwtResponseDto> {
    const { username, password } = loginDto;

    return this.authService.loginWithLocalStrategy(username, password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<JwtResponseDto> {
    return this.authService.refreshToken(refreshToken);
  }
}
