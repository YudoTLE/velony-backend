import { Exclude, Expose, Type } from 'class-transformer';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

import { MessageResponseDto } from './message-response.dto';

@Exclude()
class GetOlderMessagesDependenciesResponseDto {
  @Expose()
  @Type(() => UserResponseDto)
  readonly users: UserResponseDto[];
}

@Exclude()
export class GetOlderMessagesResponseDto {
  @Expose()
  @Type(() => MessageResponseDto)
  readonly messages: MessageResponseDto[];

  @Expose()
  @Type(() => GetOlderMessagesDependenciesResponseDto)
  readonly dependencies: GetOlderMessagesDependenciesResponseDto;
}
