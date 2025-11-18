import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CreateMessageResponseDto {
  @Expose({ name: 'uuid' })
  id: string;
}
