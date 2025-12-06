import { Exclude, Expose, Type, Transform } from 'class-transformer';

import { UserDataResponseDto } from './user-data-response.dto';
import { UserMetadataResponseDto } from './user-metadata-response.dto';

@Exclude()
export class UserResponseDto {
  @Expose({ name: 'uuid' })
  readonly id: string;

  @Expose()
  @Transform(({ obj }) =>
    obj.deleted_at === null || obj.deleted_at === undefined
      ? {
          name: obj.name,
          username: obj.username,
          email: obj.email,
          phone_number: obj.phone_number,
          avatar_url: obj.avatar_url,
        }
      : null,
  )
  @Type(() => UserDataResponseDto)
  readonly data: UserDataResponseDto | null;

  @Expose()
  @Transform(({ obj }) => ({
    created_at: obj.created_at,
  }))
  @Type(() => UserMetadataResponseDto)
  readonly metadata: UserMetadataResponseDto;
}
