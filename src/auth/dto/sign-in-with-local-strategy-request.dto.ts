import { IsString } from 'class-validator';

export class SignInWithLocalStrategyRequestDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
