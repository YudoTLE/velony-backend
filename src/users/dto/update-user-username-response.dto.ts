import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UpdateUserUsernameResponseDto {
  @Expose()
  readonly username: string;
}
