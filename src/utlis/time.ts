import { BadRequestException } from '@nestjs/common';

/**
 * List of valid time units supported by the converter.
 */
const VALID_UNITS = ['ms', 's', 'm', 'h', 'd', 'w'] as const;
type TimeUnit = (typeof VALID_UNITS)[number];

/**
 * Checks if a given string is a valid time format.
 * Supports compound inputs like "1h30m15s500ms".
 *
 * @param input - The time string to validate.
 * @returns `true` if the input is valid, otherwise `false`.
 *
 * @example
 * isTimeString("1h30m"); // true
 * isTimeString("2x");    // false
 */
export function isTimeString(input: string): boolean {
  if (typeof input !== 'string' || !input.trim()) {
    return false;
  }

  const regex = /(\d+)([a-z]+)/g;
  let match: RegExpExecArray | null;
  let found = false;

  while ((match = regex.exec(input)) !== null) {
    found = true;
    const unit = match[2];
    if (!VALID_UNITS.includes(unit as TimeUnit)) {
      return false;
    }
  }

  return found;
}

/**
 * Converts a valid time string into multiple time units.
 * Supports compound inputs such as "1h30m15s500ms".
 *
 * Throws a {@link BadRequestException} if the input format is invalid.
 *
 * @param input - The time string to convert (e.g. `"1h30m"`, `"500ms"`, `"2d3h"`).
 * @returns An object containing equivalent durations in seconds, milliseconds, minutes, hours, days, and weeks.
 *
 * @example
 * convertTime("1h30m");
 * // Returns:
 * // {
 * //   seconds: 5400,
 * //   milliseconds: 5400000,
 * //   minutes: 90,
 * //   hours: 1.5,
 * //   days: 0.0625,
 * //   weeks: 0.00893
 * // }
 */
export function convertTime(input: string): {
  seconds: number;
  milliseconds: number;
  minutes: number;
  hours: number;
  days: number;
  weeks: number;
} {
  if (!isTimeString(input)) {
    throw new BadRequestException('Invalid time string format');
  }

  const units: Record<TimeUnit, number> = {
    ms: 1 / 1000,
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
  };

  const regex = /(\d+)(ms|s|m|h|d|w)/g;
  let match: RegExpExecArray | null;
  let totalSeconds = 0;

  while ((match = regex.exec(input)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2] as TimeUnit;

    // eslint-disable-next-line security/detect-object-injection
    const multiplier = units[unit];
    totalSeconds += value * multiplier;
  }

  return {
    seconds: totalSeconds,
    milliseconds: totalSeconds * 1000,
    minutes: totalSeconds / 60,
    hours: totalSeconds / 3600,
    days: totalSeconds / 86400,
    weeks: totalSeconds / 604800,
  };
}
