import { NotFoundException } from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'User not found',
      error: 'Not Found',
      statusCode: 404,
      errorCode: 'USER_NOT_FOUND',
    });
  }
}
