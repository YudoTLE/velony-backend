import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ConversationMetadataResponseDto {
  @Expose({ name: 'created_at' })
  readonly createdAt: Date;

  @Expose({ name: 'updated_at' })
  readonly updatedAt: Date;
}
