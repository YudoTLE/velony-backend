import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class ConversationDetailUserDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  username: string;

  @Expose({ name: 'avatar_url' })
  avatarUrl: string | null;

  @Expose()
  role: string;
}

@Exclude()
export class ConversationDetailResponseDto {
  @Expose({ name: 'uuid' })
  id: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose({ name: 'thumbnail_url' })
  thumbnailUrl: string | null;

  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Expose({ name: 'updated_at' })
  updatedAt: Date;

  @Expose()
  role: string;

  @Expose()
  @Type(() => ConversationDetailUserDto)
  users: ConversationDetailUserDto[];
}
