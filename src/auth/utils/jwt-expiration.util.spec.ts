import {
  convertJwtExpirationToMilliseconds,
  isValidJwtExpiration,
} from './jwt-expiration.util';

describe('convertJwtExpirationToMilliseconds', () => {
  it('should convert seconds correctly', () => {
    expect(convertJwtExpirationToMilliseconds('30s')).toBe(30 * 1000);
  });

  it('should convert minutes correctly', () => {
    expect(convertJwtExpirationToMilliseconds('15m')).toBe(15 * 60 * 1000);
  });

  it('should convert hours correctly', () => {
    expect(convertJwtExpirationToMilliseconds('2h')).toBe(2 * 60 * 60 * 1000);
  });

  it('should convert days correctly', () => {
    expect(convertJwtExpirationToMilliseconds('7d')).toBe(
      7 * 24 * 60 * 60 * 1000,
    );
  });

  it('should convert years correctly', () => {
    expect(convertJwtExpirationToMilliseconds('1y')).toBe(
      365 * 24 * 60 * 60 * 1000,
    );
  });

  it('should throw error for invalid format', () => {
    expect(() => convertJwtExpirationToMilliseconds('invalid')).toThrow(
      'Invalid JWT expiration format: invalid',
    );
  });

  it('should throw error for unsupported unit', () => {
    expect(() => convertJwtExpirationToMilliseconds('5z')).toThrow(
      'Invalid JWT expiration format: 5z',
    );
  });

  it('should handle default JWT expiration values', () => {
    // Default access token: 15 minutes
    expect(convertJwtExpirationToMilliseconds('15m')).toBe(15 * 60 * 1000);

    // Default refresh token: 7 days
    expect(convertJwtExpirationToMilliseconds('7d')).toBe(
      7 * 24 * 60 * 60 * 1000,
    );
  });
});

describe('isValidJwtExpiration', () => {
  it('should return true for valid expiration formats', () => {
    expect(isValidJwtExpiration('15m')).toBe(true);
    expect(isValidJwtExpiration('7d')).toBe(true);
    expect(isValidJwtExpiration('2h')).toBe(true);
    expect(isValidJwtExpiration('30s')).toBe(true);
    expect(isValidJwtExpiration('1y')).toBe(true);
  });

  it('should return false for invalid expiration formats', () => {
    expect(isValidJwtExpiration('invalid')).toBe(false);
    expect(isValidJwtExpiration('15')).toBe(false);
    expect(isValidJwtExpiration('m')).toBe(false);
    expect(isValidJwtExpiration('5z')).toBe(false);
    expect(isValidJwtExpiration('')).toBe(false);
    expect(isValidJwtExpiration('15minutes')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(isValidJwtExpiration('0s')).toBe(true); // technically valid
    expect(isValidJwtExpiration('999999d')).toBe(true); // large numbers
    expect(isValidJwtExpiration('-5m')).toBe(false); // negative numbers
  });
});
