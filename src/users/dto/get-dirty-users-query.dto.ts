import { BadRequestException } from '@nestjs/common';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  Max,
  ValidateNested,
  IsDate,
} from 'class-validator';

class CursorResponseDto {
  @Transform(({ value }) => new Date(value))
  @IsDate({
    message: () => `Updated at must be a date`,
  })
  updatedAt: Date;
  @IsUUID('4', {
    message: ({ constraints }) => `Message ID must be a UUID v${constraints}`,
  })
  userId: string;
}

export class GetDirtyUsersQueryDto {
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
  @Type(() => CursorResponseDto)
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
