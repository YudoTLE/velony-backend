import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UpdateUserNameResponseDto {
  @Expose()
  readonly name: string;
}
