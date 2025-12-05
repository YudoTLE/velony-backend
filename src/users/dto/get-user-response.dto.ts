import { Exclude, Expose, Type } from 'class-transformer';

import { UserResponseDto } from './user-response.dto';

@Exclude()
export class GetUserResponseDto {
  @Expose()
  @Type(() => UserResponseDto)
  readonly user: UserResponseDto;
}
