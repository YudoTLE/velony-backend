import { Exclude, Expose, Type } from 'class-transformer';

import { UserCreatedResponseDto } from './user-created-response.dto';
import { UserDeletedResponseDto } from './user-deleted-response.dto';
import { UserUpdatedResponseDto } from './user-updated-response.dto';

@Exclude()
class CategorizedUsersResponseDto {
  @Expose()
  readonly version?: number;

  @Expose()
  @Type(() => UserCreatedResponseDto)
  readonly created: UserCreatedResponseDto[];

  @Expose()
  @Type(() => UserUpdatedResponseDto)
  readonly updated: UserUpdatedResponseDto[];

  @Expose()
  @Type(() => UserDeletedResponseDto)
  readonly deleted: UserDeletedResponseDto[];
}

@Exclude()
export class GetDirtyUsersResponseDto {
  @Expose()
  readonly version?: string;

  @Expose()
  @Type(() => CategorizedUsersResponseDto)
  readonly users: CategorizedUsersResponseDto;
}
