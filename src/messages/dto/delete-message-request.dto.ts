import { IsUUID } from 'class-validator';

export class DeleteMessageRequestDto {
  @IsUUID('4', {
    message: ({ constraints }) => `ID must be a UUID v${constraints[0]}`,
  })
  id: string;
}
