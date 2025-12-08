import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ConversationDeletedResponseDto {
  @Expose({ name: 'uuid' })
  readonly id: string;
}
