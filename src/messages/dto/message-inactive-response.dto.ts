import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MessageInactiveResponseDto {
  @Expose({ name: 'uuid' })
  readonly id: string;

  @Expose({ name: 'previous_uuid' })
  readonly previousId: string | null;

  @Expose({ name: 'user_uuid' })
  readonly userId: string | null;

  @Expose({ name: 'conversation_uuid' })
  readonly conversationId: string;

  @Expose({ name: 'created_at' })
  readonly createdAt: Date;

  @Expose({ name: 'updated_at' })
  readonly updatedAt: Date;

  @Expose({ name: 'is_self' })
  readonly isSelf: boolean;
}
