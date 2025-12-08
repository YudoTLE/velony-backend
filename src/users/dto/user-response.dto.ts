import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @Expose({ name: 'uuid' })
  readonly id: string;

  @Expose()
  readonly name: string;

  @Expose()
  readonly username: string;

  @Expose()
  readonly email: string | null;

  @Expose({ name: 'phone_number' })
  readonly phoneNumber: string | null;

  @Expose({ name: 'avatar_url' })
  readonly avatarUrl: string | null;

  @Expose({ name: 'created_at' })
  readonly createdAt: Date;
}
