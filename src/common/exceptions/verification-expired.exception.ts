import { BadRequestException } from '@nestjs/common';

export class VerificationExpiredException extends BadRequestException {
  constructor() {
    super({
      message: 'Verification code has expired',
      error: 'Bad Request',
      statusCode: 400,
      errorCode: 'VERIFICATION_EXPIRED',
    });
  }
}
