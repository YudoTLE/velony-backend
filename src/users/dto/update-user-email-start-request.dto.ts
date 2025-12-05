import { IsEmail } from 'class-validator';

export class UpdateUserEmailStartRequestDto {
  @IsEmail()
  email: string;
}
