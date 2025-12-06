import { NotFoundException } from '@nestjs/common';

export class UserConversationNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'User conversation not found',
      error: 'Not Found',
      statusCode: 404,
      errorCode: 'USER_CONVERSATION_NOT_FOUND',
    });
  }
}
