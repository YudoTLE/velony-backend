import { Exclude, Expose, Type } from 'class-transformer';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

import { MessageActiveResponseDto } from './message-active-response.dto';
import { MessageInactiveResponseDto } from './message-inactive-response.dto';

@Exclude()
class CategorizedMessagesResponseDto {
  @Expose()
  @Type(() => MessageActiveResponseDto)
  readonly active: MessageActiveResponseDto[];

  @Expose()
  @Type(() => MessageInactiveResponseDto)
  readonly inactive: MessageInactiveResponseDto[];
}

@Exclude()
class GetOlderMessagesDependenciesResponseDto {
  @Expose()
  @Type(() => UserResponseDto)
  readonly users: UserResponseDto[];
}

@Exclude()
export class GetOlderMessagesResponseDto {
  @Expose()
  @Type(() => CategorizedMessagesResponseDto)
  readonly messages: CategorizedMessagesResponseDto[];

  @Expose()
  @Type(() => GetOlderMessagesDependenciesResponseDto)
  readonly dependencies: GetOlderMessagesDependenciesResponseDto;
}
