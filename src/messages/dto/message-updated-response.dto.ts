import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MessageUpdatedResponseDto {
  @Expose({ name: 'uuid' })
  readonly id: string;

  @Expose()
  readonly content: string;

  @Expose({ name: 'updated_at' })
  readonly updatedAt: Date;
}
