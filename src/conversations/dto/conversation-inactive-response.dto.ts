import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ConversationInactiveResponseDto {
  @Expose({ name: 'uuid' })
  readonly id: string;

  @Expose({ name: 'created_at' })
  readonly createdAt: Date;

  @Expose({ name: 'updated_at' })
  readonly updatedAt: Date;
}
