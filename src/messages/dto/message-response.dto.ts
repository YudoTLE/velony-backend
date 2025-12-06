import { Exclude, Expose, Transform, plainToInstance } from 'class-transformer';

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
  @Transform(({ obj }) => {
    if (obj.deleted_at !== null && obj.deleted_at !== undefined) {
      return null;
    }
    return plainToInstance(MessageDataResponseDto, obj);
  })
  readonly data: MessageDataResponseDto | null;

  @Expose()
  @Transform(({ obj }) => plainToInstance(MessageMetadataResponseDto, obj))
  readonly metadata: MessageMetadataResponseDto;
}
