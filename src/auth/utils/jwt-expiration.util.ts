/**
 * Converts JWT expiration string format to milliseconds
 * Supports formats like: '15m', '7d', '2h', '30s', '1y'
 *
 * @param expirationString - The expiration string (e.g., '15m', '7d')
 * @returns The expiration time in milliseconds
 * @throws Error if the format is invalid
 */
export function convertJwtExpirationToMilliseconds(
  expirationString: string,
): number {
  const match = expirationString.match(/^(\d+)([smhdy])$/);

  if (!match) {
    throw new Error(`Invalid JWT expiration format: ${expirationString}`);
  }

  const [, amountStr, unit] = match;
  const amount = parseInt(amountStr, 10);

  const unitMultipliers = {
    s: 1000,
    m: 1000 * 60,
    h: 1000 * 60 * 60,
    d: 1000 * 60 * 60 * 24,
    y: 1000 * 60 * 60 * 24 * 365,
  };

  const multiplier = unitMultipliers[unit as keyof typeof unitMultipliers];

  if (!multiplier) {
    throw new Error(`Unsupported time unit: ${unit}`);
  }

  return amount * multiplier;
}

/**
 * Validates JWT expiration string format
 * Used as a class-validator decorator for environment configuration
 *
 * @param value - The value to validate
 * @returns true if valid, false otherwise
 */
export function isValidJwtExpiration(value: string): boolean {
  try {
    convertJwtExpirationToMilliseconds(value);
    return true;
  } catch {
    return false;
  }
}
