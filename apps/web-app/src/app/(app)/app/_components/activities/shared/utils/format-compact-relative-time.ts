import { formatDistanceToNow } from 'date-fns';

interface FormatCompactRelativeTimeOptions {
  addSuffix?: boolean;
}

/**
 * Formats relative time in a compact format suitable for mobile displays.
 * Replaces "Less than a minute ago" with "Just now" and shortens other formats.
 *
 * @param date - The date to format
 * @param options - Formatting options (same as formatDistanceToNow)
 * @returns Compact relative time string
 */
export function formatCompactRelativeTime(
  date: Date | number,
  options: FormatCompactRelativeTimeOptions = {},
): string {
  const { addSuffix = false } = options;

  // Get the standard format from date-fns
  let formatted = formatDistanceToNow(date, { addSuffix });

  // Replace "Less than a minute ago" with "Just now"
  if (formatted === 'less than a minute ago') {
    return 'Just now';
  }

  // Replace "less than a minute" (without suffix) with "Just now"
  // This handles the case when addSuffix: false and the component adds " ago" later
  if (formatted === 'less than a minute') {
    return 'Just now';
  }

  // Replace "in less than a minute" with "in a moment" (for future times)
  if (formatted === 'in less than a minute') {
    return 'in a moment';
  }

  // Shorten other formats for mobile
  // "X minutes ago" → "Xm ago"
  formatted = formatted.replace(/(\d+) minutes? ago/g, '$1m ago');
  formatted = formatted.replace(/in (\d+) minutes?/g, 'in $1m');

  // "X hours ago" → "Xh ago"
  formatted = formatted.replace(/(\d+) hours? ago/g, '$1h ago');
  formatted = formatted.replace(/in (\d+) hours?/g, 'in $1h');

  // "X days ago" → "Xd ago"
  formatted = formatted.replace(/(\d+) days? ago/g, '$1d ago');
  formatted = formatted.replace(/in (\d+) days?/g, 'in $1d');

  // "X months ago" → "Xmo ago"
  formatted = formatted.replace(/(\d+) months? ago/g, '$1mo ago');
  formatted = formatted.replace(/in (\d+) months?/g, 'in $1mo');

  // "X years ago" → "Xy ago"
  formatted = formatted.replace(/(\d+) years? ago/g, '$1y ago');
  formatted = formatted.replace(/in (\d+) years?/g, 'in $1y');

  // Remove "about " prefix if present (some components already do this, but we'll handle it here too)
  formatted = formatted.replace(/^about /, '');

  return formatted;
}

/**
 * Formats relative time with "ago" suffix, but intelligently handles "Just now"
 * to avoid "Just now ago". Use this when you need to add "ago" manually.
 *
 * @param date - The date to format
 * @returns Compact relative time string with "ago" suffix (or "Just now" without "ago")
 */
export function formatCompactRelativeTimeWithAgo(date: Date | number): string {
  const formatted = formatCompactRelativeTime(date, { addSuffix: false });
  // If it's "Just now", don't add "ago"
  if (formatted === 'Just now') {
    return formatted;
  }
  return `${formatted} ago`;
}
