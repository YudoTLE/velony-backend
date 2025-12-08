import { Exclude, Expose, Type } from 'class-transformer';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

import { MessageDeletedResponseDto } from './message-deleted-response.dto';
import { MessageResponseDto } from './message-response.dto';

@Exclude()
class CategorizedMessagesResponseDto {
  @Expose()
  @Type(() => MessageResponseDto)
  readonly active: MessageResponseDto[];

  @Expose()
  @Type(() => MessageDeletedResponseDto)
  readonly deleted: MessageDeletedResponseDto[];
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
