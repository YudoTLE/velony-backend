import { Exclude, Expose, Type } from 'class-transformer';

import { UserActiveResponseDto } from './user-active-response.dto';
import { UserInactiveResponseDto } from './user-inactive-response.dto';

@Exclude()
class CategorizedUsersResponseDto {
  @Expose()
  readonly version?: number;

  @Expose()
  @Type(() => UserActiveResponseDto)
  readonly active: UserActiveResponseDto[];

  @Expose()
  @Type(() => UserInactiveResponseDto)
  readonly inactive: UserInactiveResponseDto[];
}

@Exclude()
export class GetDirtyUsersResponseDto {
  @Expose()
  readonly version?: string;

  @Expose()
  @Type(() => CategorizedUsersResponseDto)
  readonly users: CategorizedUsersResponseDto;
}
