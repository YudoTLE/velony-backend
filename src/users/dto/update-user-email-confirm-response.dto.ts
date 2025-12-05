import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UpdateUserEmailConfirmResponseDto {
  @Expose()
  readonly email: string;
}
