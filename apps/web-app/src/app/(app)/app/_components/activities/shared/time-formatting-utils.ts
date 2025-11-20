/**
 * Time formatting utilities for activities
 * Consolidates all time-related formatting functions used across activity drawers
 */

/**
 * Format seconds to mm:ss format
 * @param seconds - Total seconds
 * @returns Formatted string like "12:45"
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds to HH:MM:SS format
 * @param seconds - Total seconds
 * @returns Formatted string like "01:23:45"
 */
export function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration in seconds to human-readable format
 * @param seconds - Total seconds
 * @returns Formatted string like "1h 23m" or "45m" or "30s"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${secs}s`;
}

/**
 * Format overdue time in minutes to human-readable format
 * @param minutes - Total minutes overdue
 * @returns Formatted string like "2 hours" or "45 min"
 */
export function formatOverdueTime(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0
      ? `${hours}h ${mins}m`
      : `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `${minutes} min`;
}

/**
 * Format duration in minutes to hours and minutes
 * @param minutes - Total minutes
 * @returns Formatted string like "2h 30m" or "45m"
 */
export function formatMinutesToHoursMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}m`;
}

/**
 * Convert minutes to seconds
 */
export function minutesToSeconds(minutes: number): number {
  return minutes * 60;
}

/**
 * Convert seconds to minutes
 */
export function secondsToMinutes(seconds: number): number {
  return Math.floor(seconds / 60);
}

/**
 * Convert hours to seconds
 */
export function hoursToSeconds(hours: number): number {
  return hours * 3600;
}
