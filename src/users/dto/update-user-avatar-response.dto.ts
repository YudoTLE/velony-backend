import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UpdateUserAvatarResponseDto {
  @Expose()
  readonly avatarUrl: string;
}
