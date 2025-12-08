import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MessageDeletedResponseDto {
  @Expose({ name: 'uuid' })
  readonly id: string;
}
