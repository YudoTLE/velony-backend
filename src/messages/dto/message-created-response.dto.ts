import { Exclude } from 'class-transformer';

import { MessageResponseDto } from './message-response.dto';

@Exclude()
export class MessageCreatedResponseDto extends MessageResponseDto {}
