import { Exclude, Expose, Type } from 'class-transformer';

import { UserResponseDto } from './user-response.dto';

@Exclude()
export class GetDirtyUsersResponseDto {
  @Expose()
  readonly version?: string;

  @Expose()
  @Type(() => UserResponseDto)
  readonly users: UserResponseDto[];
}
