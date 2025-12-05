import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserNameRequestDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;
}
