import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateConversationRequestDto {
  @IsOptional()
  @IsString({ message: () => 'Content must be a string' })
  @MinLength(3, {
    message: ({ constraints }) =>
      `Title must be at least ${constraints[0]} characters`,
  })
  @MaxLength(50, {
    message: ({ constraints }) =>
      `Title must be at most ${constraints[0]} characters`,
  })
  title?: string;

  @IsOptional()
  @IsString({ message: () => 'Description must be a string' })
  @MaxLength(10000, {
    message: ({ constraints }) =>
      `Description must be at most ${constraints[0]} characters`,
  })
  description?: string;
}
