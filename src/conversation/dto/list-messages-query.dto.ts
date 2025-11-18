import { IsUUID, IsInt, Min, Max } from 'class-validator';

export class ListMessagesQueryDto {
  @IsUUID('4', { message: () => 'Before must be a UUID' })
  before?: string;

  @IsInt({ message: () => 'Limit must be an integer' })
  @Min(0, { message: () => 'Limit must be at least 0' })
  @Max(100, { message: () => 'Limit must be at most 100' })
  limit?: number;
}
