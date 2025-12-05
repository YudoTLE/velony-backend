import { MessageTable } from '../types/message-table';

export class MessageCreatedEvent {
  constructor(
    public readonly message: Pick<
      MessageTable,
      | 'uuid'
      | 'previous_uuid'
      | 'user_uuid'
      | 'conversation_uuid'
      | 'content'
      | 'created_at'
      | 'updated_at'
    >,
    public readonly conversationId: number,
    public readonly optimisticId?: string,
  ) {}
}
