import { Exclude, Expose, Type } from 'class-transformer';

import { MessageCreatedResponseDto } from './message-created-response.dto';

@Exclude()
export class WsMessageCreatedResponseDto {
  @Expose()
  @Type(() => MessageCreatedResponseDto)
  message: MessageCreatedResponseDto;

  @Expose()
  optimisticId?: string;
}
