import { Exclude, Expose, Transform, plainToInstance } from 'class-transformer';

import { ConversationDataResponseDto } from './conversation-data-response.dto';
import { ConversationMetadataResponseDto } from './conversation-metadata-response.dto';

@Exclude()
export class ConversationResponseDto {
  @Expose({ name: 'uuid' })
  readonly id: string;

  @Expose()
  @Transform(({ obj }) => {
    if (obj.deleted_at !== null && obj.deleted_at !== undefined) {
      return null;
    }
    return plainToInstance(ConversationDataResponseDto, obj);
  })
  readonly data: ConversationDataResponseDto;

  @Expose()
  @Transform(({ obj }) => plainToInstance(ConversationMetadataResponseDto, obj))
  readonly metadata: ConversationMetadataResponseDto;
}
