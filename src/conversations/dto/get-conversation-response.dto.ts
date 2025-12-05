import { Exclude, Expose, Type } from 'class-transformer';

import { ConversationResponseDto } from './conversation-response.dto';

@Exclude()
export class GetConversationResponseDto {
  @Expose()
  @Type(() => ConversationResponseDto)
  readonly conversation: ConversationResponseDto;
}
