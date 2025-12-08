import { MessageTable } from '../types/message-table';

export class MessageUpdatedEvent {
  constructor(
    public readonly message: Pick<
      MessageTable,
      'uuid' | 'content' | 'updated_at'
    >,
    public readonly conversationId: number,
  ) {}
}
