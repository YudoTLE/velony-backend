import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  IsUrl,
} from 'class-validator';

import { isValidJwtExpiration } from '../auth/utils/jwt-expiration.util';

@ValidatorConstraint({ name: 'isJwtExpiration', async: false })
export class IsJwtExpirationConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    return isValidJwtExpiration(value);
  }

  defaultMessage(): string {
    return 'JWT expiration must be in format like "15m", "7d", "2h", "30s", or "1y"';
  }
}

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DB_URL: string;

  @IsOptional()
  @IsString()
  NODE_ENV?: string = 'development';

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  DB_MAX_CONNECTIONS?: number = 20;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1000)
  DB_IDLE_TIMEOUT?: number = 30000;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1000)
  DB_CONNECTION_TIMEOUT?: number = 2000;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number = 5000;

  @IsOptional()
  @IsString()
  REDIS_HOST?: string = 'localhost';

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(65535)
  REDIS_PORT?: number = 6379;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET: string;

  @IsOptional()
  @IsString()
  @Validate(IsJwtExpirationConstraint)
  JWT_ACCESS_EXPIRATION?: string = '15m';

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsOptional()
  @IsString()
  @Validate(IsJwtExpirationConstraint)
  JWT_REFRESH_EXPIRATION?: string = '7d';

  @IsUrl()
  S3_ENDPOINT: string;

  @IsString()
  S3_REGION: string;

  @IsString()
  S3_BUCKET: string;

  @IsString()
  S3_ACCESS_KEY_ID: string;

  @IsString()
  S3_SECRET_ACCESS_KEY: string;
}
