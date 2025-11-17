import { IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class UpdateUserPasswordRequestDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/[0-9]/, {
    message: 'Password must contain at least one number',
  })
  @Matches(/[^a-zA-Z0-9]/, {
    message: 'Password must contain at least one symbol',
  })
  newPassword: string;
}
