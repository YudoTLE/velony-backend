import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserDataResponseDto {
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
}
