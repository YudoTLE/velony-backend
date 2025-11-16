import { IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class SignUpWithLocalStrategyRequestDto {
  @IsString({ message: () => `Name must be a string` })
  @MinLength(3, {
    message: ({ constraints }) =>
      `Name must be at least ${constraints[0]} characters`,
  })
  @MaxLength(100, {
    message: ({ constraints }) =>
      `Name must be at most ${constraints[0]} characters`,
  })
  name: string;

  @IsString({ message: () => `Username must be a string` })
  @MinLength(3, {
    message: ({ constraints }) =>
      `Username must be at least ${constraints[0]} characters`,
  })
  @MaxLength(50, {
    message: ({ constraints }) =>
      `Username must be at most ${constraints[0]} characters`,
  })
  @Matches(/^[A-Za-z0-9_]+$/, {
    message: () =>
      `Username can only contain letters, numbers, and underscores`,
  })
  username: string;

  @IsString({ message: () => `Password must be a string` })
  @MinLength(8, {
    message: ({ constraints }) =>
      `Password must be at least ${constraints[0]} characters`,
  })
  @MaxLength(100, {
    message: ({ constraints }) =>
      `Password must be at most ${constraints[0]} characters`,
  })
  @Matches(/[a-z]/, {
    message: () => `Password must contain at least one lowercase letter`,
  })
  @Matches(/[A-Z]/, {
    message: () => `Password must contain at least one uppercase letter`,
  })
  @Matches(/[0-9]/, {
    message: () => `Password must contain at least one number`,
  })
  @Matches(/[^a-zA-Z0-9]/, {
    message: () => `Password must contain at least one symbol`,
  })
  password: string;
}
