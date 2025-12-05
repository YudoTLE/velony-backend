import { Exclude, Expose, Type } from 'class-transformer';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

import { MessageResponseDto } from './message-response.dto';

@Exclude()
class GetDirtyMessagesDependenciesResponseDto {
  @Expose()
  @Type(() => UserResponseDto)
  readonly users: UserResponseDto[];
}

@Exclude()
export class GetDirtyMessagesResponseDto {
  @Expose()
  @Type(() => MessageResponseDto)
  readonly messages: MessageResponseDto[];

  @Expose()
  @Type(() => GetDirtyMessagesDependenciesResponseDto)
  readonly dependencies: GetDirtyMessagesDependenciesResponseDto;
}
