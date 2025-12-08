import { Exclude } from 'class-transformer';

import { ConversationResponseDto } from './conversation-response.dto';

@Exclude()
export class ConversationCreatedResponseDto extends ConversationResponseDto {}
