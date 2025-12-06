import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MessageMetadataResponseDto {
  @Expose({ name: 'created_at' })
  readonly createdAt: Date;

  @Expose({ name: 'updated_at' })
  readonly updatedAt: Date;

  @Expose({ name: 'is_self' })
  readonly isSelf: boolean;
}
