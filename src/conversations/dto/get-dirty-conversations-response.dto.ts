import { Exclude, Expose, Type } from 'class-transformer';

import { ConversationCreatedResponseDto } from './conversation-created-response.dto';
import { ConversationDeletedResponseDto } from './conversation-deleted-response.dto';
import { ConversationUpdatedResponseDto } from './conversation-updated-response.dto';

@Exclude()
class CategorizedConversationsResponseDto {
  @Expose()
  readonly version?: number;

  @Expose()
  @Type(() => ConversationCreatedResponseDto)
  readonly created: ConversationCreatedResponseDto[];

  @Expose()
  @Type(() => ConversationUpdatedResponseDto)
  readonly updated: ConversationUpdatedResponseDto[];

  @Expose()
  @Type(() => ConversationDeletedResponseDto)
  readonly deleted: ConversationDeletedResponseDto[];
}

@Exclude()
export class GetDirtyConversationsResponseDto {
  @Expose()
  readonly version?: string;

  @Expose()
  @Type(() => CategorizedConversationsResponseDto)
  readonly conversations: CategorizedConversationsResponseDto[];
}
