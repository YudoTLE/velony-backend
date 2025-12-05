import { MessageTable } from '../types/message-table';

export class MessageDeletedEvent {
  constructor(
    public readonly message: Pick<
      MessageTable,
      | 'uuid'
      | 'previous_uuid'
      | 'user_uuid'
      | 'conversation_uuid'
      | 'created_at'
      | 'updated_at'
      | 'deleted_at'
    >,
    public readonly conversationId: number,
  ) {}
}
