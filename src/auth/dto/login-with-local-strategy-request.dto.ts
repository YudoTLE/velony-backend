import { IsString } from 'class-validator';

export class LoginWithLocalStrategyRequestDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
