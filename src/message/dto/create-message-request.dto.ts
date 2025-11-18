import { IsString, MaxLength } from 'class-validator';

export class CreateMessageRequestDto {
  @IsString({ message: () => 'Content must be a string' })
  @MaxLength(10000, {
    message: ({ constraints }) =>
      `Content must be at most ${constraints[0]} characters`,
  })
  content: string;
}
