import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ConversationResponseDto {
  @Expose({ name: 'uuid' })
  readonly id: string;

  @Expose()
  readonly title: string;

  @Expose()
  readonly description: string;

  @Expose({ name: 'thumbnail_url' })
  readonly thumbnailUrl: string | null;

  @Expose({ name: 'created_at' })
  readonly createdAt: Date;

  @Expose({ name: 'updated_at' })
  readonly updatedAt: Date;
}
