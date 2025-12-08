import { MessageTable } from '../types/message-table';

export class MessageDeletedEvent {
  constructor(
    public readonly message: Pick<MessageTable, 'uuid'>,
    public readonly conversationId: number,
  ) {}
}
