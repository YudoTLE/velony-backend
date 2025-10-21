import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserSummaryResponseDto {
  @Expose({ name: 'uuid' })
  id: string;

  @Expose()
  name: string;

  @Expose()
  username: string;

  @Expose({ name: 'avatar_url' })
  avatarUrl?: string;
}
