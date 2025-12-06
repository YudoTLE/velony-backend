import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserMetadataResponseDto {
  @Expose({ name: 'created_at' })
  readonly createdAt: Date;
}
