import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserDeletedResponseDto {
  @Expose({ name: 'uuid' })
  readonly id: string;
}
