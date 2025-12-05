import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MessageDataResponseDto {
  @Expose()
  readonly content: string;
}
