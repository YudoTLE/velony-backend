import { Exclude, Expose, Transform, Type } from 'class-transformer';

import { MessageDataResponseDto } from './message-data-response.dto';

@Exclude()
export class MessageResponseDto {
  @Expose({ name: 'uuid' })
  readonly id: string;

  @Expose({ name: 'previous_uuid' })
  readonly previousId: string | null;

  @Expose({ name: 'user_uuid' })
  readonly userId: string | null;

  @Expose({ name: 'conversation_uuid' })
  readonly conversationId: string;

  @Expose()
  @Transform(({ obj }) =>
    obj.deleted_at === null || obj.deleted_at === undefined
      ? {
          content: obj.content,
        }
      : null,
  )
  @Type(() => MessageDataResponseDto)
  readonly data: MessageDataResponseDto | null;

  @Expose({ name: 'created_at' })
  readonly createdAt: Date;

  @Expose({ name: 'updated_at' })
  readonly updatedAt: Date;

  @Expose({ name: 'deleted_at' })
  readonly deletedAt: Date | null;

  @Expose({ name: 'is_self' })
  readonly isSelf: boolean;
}
