import { Exclude, Expose, Transform, Type } from 'class-transformer';

import { MessageDataResponseDto } from './message-data-response.dto';
import { MessageMetadataResponseDto } from './message-metadata-response.dto';

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

  @Expose()
  @Transform(({ obj }) => ({
    created_at: obj.created_at,
    updated_at: obj.updated_at,
    is_self: obj.is_self,
  }))
  @Type(() => MessageMetadataResponseDto)
  readonly metadata: MessageMetadataResponseDto;
}
