import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class ConversationSummaryLastMessageDto {
  @Expose({ name: 'uuid' })
  id: string;

  @Expose()
  content: string;

  @Expose({ name: 'user_name' })
  userName: string | null;

  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}

@Exclude()
export class ConversationSummaryResponseDto {
  @Expose({ name: 'uuid' })
  id: string;

  @Expose()
  title: string;

  @Expose({ name: 'thumbnail_url' })
  thumbnailUrl: string | null;

  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Expose({ name: 'last_message' })
  @Type(() => ConversationSummaryLastMessageDto)
  lastMessage: ConversationSummaryLastMessageDto | null;
}
