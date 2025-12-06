import { NotFoundException } from '@nestjs/common';

export class MessageNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'Message not found',
      error: 'Not Found',
      statusCode: 404,
      errorCode: 'MESSAGE_NOT_FOUND',
    });
  }
}
