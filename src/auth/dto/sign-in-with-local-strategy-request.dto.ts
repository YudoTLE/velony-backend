import { IsString } from 'class-validator';

export class SignInWithLocalStrategyRequestDto {
  @IsString({ message: 'Username must be a string' })
  username: string;

  @IsString({ message: 'Password must be a string' })
  password: string;
}
