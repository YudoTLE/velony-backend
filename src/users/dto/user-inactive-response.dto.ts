import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserInactiveResponseDto {
  @Expose({ name: 'uuid' })
  readonly id: string;

  @Expose({ name: 'created_at' })
  readonly createdAt: Date;
}
