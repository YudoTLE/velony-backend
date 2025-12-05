import { BadRequestException } from '@nestjs/common';

export class VerificationCodeInvalidException extends BadRequestException {
  constructor() {
    super({
      message: 'Invalid verification code',
      error: 'Bad Request',
      statusCode: 400,
      errorCode: 'VERIFICATION_CODE_INVALID',
    });
  }
}
