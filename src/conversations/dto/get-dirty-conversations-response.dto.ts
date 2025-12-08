import { Exclude, Expose, Type } from 'class-transformer';

import { ConversationActiveResponseDto } from './conversation-active-response.dto';
import { ConversationInactiveResponseDto } from './conversation-inactive-response.dto';

@Exclude()
class CategorizedConversationsResponseDto {
  @Expose()
  readonly version?: number;

  @Expose()
  @Type(() => ConversationActiveResponseDto)
  readonly active: ConversationActiveResponseDto[];

  @Expose()
  @Type(() => ConversationInactiveResponseDto)
  readonly inactive: ConversationInactiveResponseDto[];
}

@Exclude()
export class GetDirtyConversationsResponseDto {
  @Expose()
  @Type(() => CategorizedConversationsResponseDto)
  readonly conversations: CategorizedConversationsResponseDto[];
}
