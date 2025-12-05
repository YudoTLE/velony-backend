import { UnauthorizedException } from '@nestjs/common';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super({
      message: 'Invalid credentials',
      error: 'Unauthorized',
      statusCode: 401,
      errorCode: 'INVALID_CREDENTIALS',
    });
  }
}
