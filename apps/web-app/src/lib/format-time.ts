import { format } from 'date-fns';

/**
 * Format a date/time according to user's time format preference
 * @param date - The date to format
 * @param timeFormat - The user's time format preference ('12h' or '24h')
 * @returns Formatted time string
 */
export function formatTimeWithPreference(
  date: Date | string | number,
  timeFormat: '12h' | '24h' = '12h',
): string {
  const dateObj =
    typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

  if (timeFormat === '24h') {
    return format(dateObj, 'HH:mm');
  }

  return format(dateObj, 'h:mm a');
}
