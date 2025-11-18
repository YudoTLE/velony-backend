import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateMessageRequestDto {
  @IsString({ message: () => 'Content must be a string' })
  @MaxLength(10000, {
    message: ({ constraints }) =>
      `Content must be at most ${constraints[0]} characters`,
  })
  content: string;

  @IsOptional()
  @IsUUID(4, { message: () => 'Optimistic ID must be a UUID' })
  optimisticId?: string;
}
