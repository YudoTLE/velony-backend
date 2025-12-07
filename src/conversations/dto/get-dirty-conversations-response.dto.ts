import { Exclude, Expose, Type } from 'class-transformer';

import { ConversationResponseDto } from './conversation-response.dto';

@Exclude()
export class GetDirtyConversationsResponseDto {
  @Expose()
  readonly version?: string;

  @Expose()
  @Type(() => ConversationResponseDto)
  readonly conversations: ConversationResponseDto[];
}
