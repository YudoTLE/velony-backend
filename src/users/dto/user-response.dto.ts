import { Exclude, Expose, Transform, plainToInstance } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { UserDataResponseDto } from './user-data-response.dto';
import { UserMetadataResponseDto } from './user-metadata-response.dto';

@Exclude()
export class UserResponseDto {
  @Expose({ name: 'uuid' })
  readonly id: string;

  @Expose()
  @Transform(({ obj }) => {
    if (obj.deleted_at !== null && obj.deleted_at !== undefined) {
      return null;
    }
    return plainToInstance(UserDataResponseDto, obj);
  })
  @ValidateNested()
  readonly data: UserDataResponseDto | null;

  @Expose()
  @Transform(({ obj }) => plainToInstance(UserMetadataResponseDto, obj))
  @ValidateNested()
  readonly metadata: UserMetadataResponseDto;
}
