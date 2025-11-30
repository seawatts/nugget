import type { Activities } from '@nugget/db/schema';
import { startOfDay, subDays } from 'date-fns';

/**
 * Calculate activity type distribution
 */
export function calculateActivityTypeDistribution(
  activities: Array<typeof Activities.$inferSelect>,
  days = 7,
): Array<{ type: string; count: number; label: string }> {
  const cutoff = startOfDay(subDays(new Date(), days));
  const filtered = activities.filter((a) => new Date(a.startTime) >= cutoff);

  const typeMap = new Map<string, number>();
  filtered.forEach((activity) => {
    const type = activity.type;
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
  });

  const typeLabels: Record<string, string> = {
    bath: 'Bath',
    bottle: 'Bottle',
    'contrast-time': 'Contrast Time',
    diaper: 'Diaper',
    dirty: 'Dirty',
    'doctor-visit': 'Doctor Visit',
    feeding: 'Feeding',
    'nail-trimming': 'Nail Trimming',
    nursing: 'Nursing',
    pumping: 'Pumping',
    sleep: 'Sleep',
    solids: 'Solids',
    stroller_walk: 'Stroller Walk',
    'vitamin-d': 'Vitamin D',
    wet: 'Wet',
  };

  return Array.from(typeMap.entries())
    .map(([type, count]) => ({
      count,
      label: typeLabels[type] || type,
      type,
    }))
    .sort((a, b) => b.count - a.count);
}
