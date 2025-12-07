import { BadRequestException } from '@nestjs/common';
import { plainToInstance, Transform } from 'class-transformer';
import {
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  Max,
  ValidateNested,
} from 'class-validator';

class CursorResponseDto {
  @IsUUID('7', {
    message: ({ constraints }) =>
      `Message ID must be a UUID v${constraints[0]}`,
  })
  messageId: string;
}

export class GetOlderMessagesQueryDto {
  @Transform(({ value }) => {
    try {
      return plainToInstance(
        CursorResponseDto,
        JSON.parse(Buffer.from(value, 'base64').toString()),
      );
    } catch {
      throw new BadRequestException(
        'Cursor must be a valid base64-encoded JSON object',
      );
    }
  })
  @IsOptional()
  @ValidateNested()
  cursor?: CursorResponseDto;

  @IsOptional()
  @IsInt({ message: () => 'Limit must be an integer' })
  @Min(0, {
    message: ({ constraints }) => `Limit must be at least ${constraints[0]}`,
  })
  @Max(100, {
    message: ({ constraints }) => `Limit must be at most ${constraints[0]}`,
  })
  limit: number = 50;
}
