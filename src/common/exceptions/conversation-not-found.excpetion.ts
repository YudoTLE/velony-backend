import { NotFoundException } from '@nestjs/common';

export class ConversationNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'Conversation not found',
      error: 'Not Found',
      statusCode: 404,
      errorCode: 'CONVERSATION_NOT_FOUND',
    });
  }
}
