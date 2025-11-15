import { IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class UpdateUserUsernameRequestDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;
}
