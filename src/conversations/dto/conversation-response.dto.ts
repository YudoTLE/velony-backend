import { Exclude, Expose, Transform, Type } from 'class-transformer';

import { ConversationDataResponseDto } from './conversation-data-response.dto';

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

  @Expose({ name: 'created_at' })
  readonly createdAt: Date;

  @Expose({ name: 'updated_at' })
  readonly updatedAt: Date;
}
