import { MessageTable } from '../types/message-table';

export class MessageUpdatedEvent {
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
  ) {}
}
