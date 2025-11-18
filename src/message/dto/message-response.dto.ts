import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class MessageResponseDto {
  @Expose({ name: 'uuid' })
  id: string;

  @Expose({ name: 'user_uuid' })
  userId: string;

  @Expose()
  content: string;

  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
