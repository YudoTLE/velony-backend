import { Exclude, Expose, Transform, Type } from 'class-transformer';

import { ConversationDataResponseDto } from './conversation-data-response.dto';
import { ConversationMetadataResponseDto } from './conversation-metadata-response.dto';

@Exclude()
export class ConversationResponseDto {
  @Expose({ name: 'uuid' })
  readonly id: string;

  @Expose()
  @Transform(({ obj }) =>
    obj.deleted_at === null || obj.deleted_at === undefined
      ? {
          title: obj.title,
          description: obj.description,
          thumbnail_url: obj.thumbnail_url,
        }
      : null,
  )
  @Type(() => ConversationDataResponseDto)
  readonly data: ConversationDataResponseDto;

  @Expose()
  @Transform(({ obj }) => ({
    created_at: obj.created_at,
    updated_at: obj.updated_at,
  }))
  @Type(() => ConversationMetadataResponseDto)
  readonly metadata: ConversationMetadataResponseDto;
}
