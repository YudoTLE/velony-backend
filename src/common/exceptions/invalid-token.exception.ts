import { UnauthorizedException } from '@nestjs/common';

export class InvalidTokenException extends UnauthorizedException {
  constructor() {
    super({
      message: 'Invalid or expired token',
      error: 'Unauthorized',
      statusCode: 401,
      errorCode: 'INVALID_TOKEN',
    });
  }
}
