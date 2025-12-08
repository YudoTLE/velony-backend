import { Exclude, Expose, Type } from 'class-transformer';

import { MessageUpdatedResponseDto } from './message-updated-response.dto';

@Exclude()
export class WsMessageUpdateResponseDto {
  @Expose()
  @Type(() => MessageUpdatedResponseDto)
  message: MessageUpdatedResponseDto;
}
