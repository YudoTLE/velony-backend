import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ConversationDataResponseDto {
  @Expose()
  readonly title: string;

  @Expose()
  readonly description: string;

  @Expose({ name: 'thumbnail_url' })
  readonly thumbnailUrl: string | null;
}
