import { IsString, IsStrongPassword, MinLength } from 'class-validator';

export class CreateUserWithUsernameRequestDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(3)
  username: string;

  @IsStrongPassword()
  password: string;
}
