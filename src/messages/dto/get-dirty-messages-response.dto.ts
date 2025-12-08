import { Exclude, Expose, Type } from 'class-transformer';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

import { MessageCreatedResponseDto } from './message-created-response.dto';
import { MessageDeletedResponseDto } from './message-deleted-response.dto';
import { MessageUpdatedResponseDto } from './message-updated-response.dto';

@Exclude()
class CategorizedMessagesResponseDto {
  @Expose()
  readonly version?: number;

  @Expose()
  @Type(() => MessageCreatedResponseDto)
  readonly created: MessageCreatedResponseDto[];

  @Expose()
  @Type(() => MessageUpdatedResponseDto)
  readonly updated: MessageUpdatedResponseDto[];

  @Expose()
  @Type(() => MessageDeletedResponseDto)
  readonly deleted: MessageDeletedResponseDto[];
}

@Exclude()
class DependenciesResponseDto {
  @Expose()
  @Type(() => UserResponseDto)
  readonly users: UserResponseDto[];
}

@Exclude()
export class GetDirtyMessagesResponseDto {
  @Expose()
  @Type(() => CategorizedMessagesResponseDto)
  readonly messages: CategorizedMessagesResponseDto;

  @Expose()
  @Type(() => DependenciesResponseDto)
  readonly dependencies: DependenciesResponseDto;
}
