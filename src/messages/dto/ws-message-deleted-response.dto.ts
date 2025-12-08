import { Exclude, Expose, Type } from 'class-transformer';

import { MessageDeletedResponseDto } from './message-deleted-response.dto';

@Exclude()
export class WsMessageDeletedResponseDto {
  @Expose()
  @Type(() => MessageDeletedResponseDto)
  message: MessageDeletedResponseDto;
}
