import { IsString } from 'class-validator';

export class UpdateUserEmailConfirmRequestDto {
  @IsString()
  otp: string;
}
