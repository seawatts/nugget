/**
 * Format age in a readable format
 */
export function formatAge(ageDays: number): string {
  if (ageDays < 7) {
    return `${ageDays} ${ageDays === 1 ? 'day' : 'days'}`;
  }
  if (ageDays < 30) {
    const weeks = Math.floor(ageDays / 7);
    const days = ageDays % 7;
    if (days === 0) {
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    }
    return `${weeks}w ${days}d`;
  }
  if (ageDays < 365) {
    const months = Math.floor(ageDays / 30.44);
    const days = Math.floor(ageDays % 30.44);
    if (days === 0) {
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    }
    return `${months}m ${days}d`;
  }
  const years = Math.floor(ageDays / 365.25);
  const months = Math.floor((ageDays % 365.25) / 30.44);
  if (months === 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }
  return `${years}y ${months}m`;
}
