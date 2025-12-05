import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateMessageRequestDto {
  @IsOptional()
  @IsUUID('4', {
    message: ({ constraints }) => `ID must be a UUID v${constraints[0]}`,
  })
  optimisticId?: string;

  @IsUUID('4', {
    message: ({ constraints }) => `ID must be a UUID v${constraints[0]}`,
  })
  conversationId: string;

  @IsString({ message: () => 'Content must be a string' })
  @MaxLength(10000, {
    message: ({ constraints }) =>
      `Content must be at most ${constraints[0]} characters`,
  })
  content: string;
}
