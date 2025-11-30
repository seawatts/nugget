import type { Achievement } from '../types';

/**
 * Progressive disclosure system for achievements
 * Only shows earned achievements and the next logical target in each progression chain
 * Similar to Call of Duty/Battlefield achievement systems
 */

/**
 * Define achievement progression chains - achievements that unlock in sequence
 */
const ACHIEVEMENT_CHAINS: Record<string, Array<string>> = {
  // Activity count chains
  activities: [
    'first-activity',
    '10-activities',
    '25-activities',
    '50-activities',
    '100-activities',
    '250-activities',
    '500-activities',
    '1000-activities',
    '2500-activities',
    '5000-activities',
    '10000-activities',
  ],
  // Bath progression
  bath: ['10-baths', '25-baths', '50-baths'],
  // Time-based progression
  'consecutive-days': [
    '7-consecutive-days',
    '14-consecutive-days',
    '30-consecutive-days',
  ],
  // Contrast time progression
  'contrast-time': ['25-contrast-time', '50-contrast-time'],
  // Diaper streaks
  'diaper-streak': ['3-day-diaper', '7-day-diaper', '30-day-diaper'],
  diapers: [
    '50-diapers',
    '100-diapers',
    '250-diapers',
    '500-diapers',
    '1000-diapers',
    '2500-diapers',
  ],
  // Doctor visits progression
  'doctor-visits': ['5-doctor-visits', '10-doctor-visits'],
  // Feeding streaks
  'feeding-streak': [
    '3-day-feeding',
    '7-day-feeding',
    '14-day-feeding',
    '30-day-feeding',
  ],
  // Sleep deprivation progression
  'late-nights': ['10-late-nights', '30-late-nights'],
  // Nail trimming progression
  'nail-trimming': ['10-nail-trimming', '25-nail-trimming'],
  // Perfect day streaks
  'perfect-day-streak': [
    '3-perfect-days',
    '7-perfect-days',
    '14-perfect-days',
    '30-perfect-days',
  ],
  // Pumping progression
  pumping: ['25-pumping', '50-pumping', '100-pumping'],
  'sleep-deprived': ['50-sleep-deprived-activities'],
  // Sleep streaks
  'sleep-streak': ['3-day-sleep', '7-day-sleep', '30-day-sleep'],
  // Solids progression
  solids: ['first-solids', '50-solids', '100-solids'],
  // Stroller walk progression
  stroller_walk: [
    '25-stroller-walks',
    '50-stroller-walks',
    '100-stroller-walks',
  ],
  // Survival progression
  survival: [
    'survived-first-day',
    'survived-first-week',
    'survived-first-month',
    'survived-100-days',
  ],
  'tracking-days': [
    '30-days-tracking',
    '100-days-tracking',
    '6-months-tracking',
    '1-year-tracking',
  ],
  // Tummy time progression
  'tummy-time': ['50-tummy-time', '100-tummy-time'],
  // Vitamin D progression
  'vitamin-d': ['30-vitamin-d', '100-vitamin-d'],
  'volume-fed': [
    '1l-fed',
    '5l-fed',
    '10l-fed',
    '25l-fed',
    '50l-fed',
    '100l-fed',
  ],
  wakeups: ['10-nights-wakeups', '30-nights-wakeups'],
};

/**
 * Find which chain an achievement belongs to
 */
function findAchievementChain(achievementId: string): string | null {
  for (const [chainName, chainIds] of Object.entries(ACHIEVEMENT_CHAINS)) {
    if (chainIds.includes(achievementId)) {
      return chainName;
    }
  }
  return null;
}

/**
 * Filter achievements for progressive disclosure
 * Shows:
 * 1. All earned achievements
 * 2. Next unearned achievement in a chain (if prerequisite is earned or close)
 * 3. Foundation achievements (always show if not earned)
 * 4. Special achievements (show if close to earning)
 */
export function filterAchievementsForProgression(
  achievements: Array<Achievement>,
): Array<Achievement> {
  const achievementsMap = new Map<string, Achievement>();
  achievements.forEach((ach) => {
    achievementsMap.set(ach.id, ach);
  });

  const visibleAchievements = new Set<string>();

  // Group achievements by chain
  const achievementsByChain = new Map<string, Array<Achievement>>();
  achievements.forEach((ach) => {
    const chainName = findAchievementChain(ach.id);
    if (chainName) {
      if (!achievementsByChain.has(chainName)) {
        achievementsByChain.set(chainName, []);
      }
      achievementsByChain.get(chainName)?.push(ach);
    } else {
      // Not in a chain - handle individually
      if (!achievementsByChain.has('_standalone')) {
        achievementsByChain.set('_standalone', []);
      }
      achievementsByChain.get('_standalone')?.push(ach);
    }
  });

  // Process each chain
  achievementsByChain.forEach((chainAchievements, chainName) => {
    if (chainName === '_standalone') {
      // Standalone achievements: show if earned or if they're "first" type
      chainAchievements.forEach((ach) => {
        if (
          ach.earned ||
          ach.id.includes('first-') ||
          ach.category === 'foundation'
        ) {
          visibleAchievements.add(ach.id);
        } else if (ach.category === 'special' && ach.progress > 0) {
          // Show special achievements if progress has started
          visibleAchievements.add(ach.id);
        }
      });
      return;
    }

    // Sort chain by target value (ascending) based on chain definition order
    const chainIds = ACHIEVEMENT_CHAINS[chainName];
    if (!chainIds) {
      // If chain not found in definition, show all
      chainAchievements.forEach((ach) => {
        visibleAchievements.add(ach.id);
      });
      return;
    }

    const sortedChain = [...chainAchievements].sort((a, b) => {
      const indexA = chainIds.indexOf(a.id);
      const indexB = chainIds.indexOf(b.id);
      if (indexA === -1 || indexB === -1) return 0;
      return indexA - indexB;
    });

    // Find all earned achievements and their indices
    const earnedIndices: number[] = [];
    sortedChain.forEach((ach, index) => {
      if (ach.earned) {
        earnedIndices.push(index);
        visibleAchievements.add(ach.id);
      }
    });

    // Determine the highest earned index
    const lastEarnedIndex =
      earnedIndices.length > 0 ? Math.max(...earnedIndices) : -1;

    // Show the next unearned achievement after the last earned one
    if (lastEarnedIndex >= 0 && lastEarnedIndex < sortedChain.length - 1) {
      const nextAchievement = sortedChain[lastEarnedIndex + 1];
      if (nextAchievement) {
        visibleAchievements.add(nextAchievement.id);

        // Show one more ahead if user is very close (85%+ progress) to next target
        if (
          nextAchievement.progress >= 85 &&
          lastEarnedIndex + 2 < sortedChain.length
        ) {
          const nextNextAchievement = sortedChain[lastEarnedIndex + 2];
          if (nextNextAchievement) {
            visibleAchievements.add(nextNextAchievement.id);
          }
        }
      }
    } else if (lastEarnedIndex === -1 && sortedChain.length > 0) {
      // No achievements earned yet - show only the first one
      const firstAchievement = sortedChain[0];
      if (firstAchievement) {
        visibleAchievements.add(firstAchievement.id);
      }
    }

    // Always show achievements that are very close to completion (90%+)
    sortedChain.forEach((ach) => {
      if (!ach.earned && ach.progress >= 90) {
        visibleAchievements.add(ach.id);
      }
    });
  });

  // Always show foundation achievements
  achievements.forEach((ach) => {
    if (ach.category === 'foundation') {
      visibleAchievements.add(ach.id);
    }
  });

  // Filter and return visible achievements
  return achievements.filter((ach) => visibleAchievements.has(ach.id));
}

/**
 * Sort achievements by progression order within categories
 */
export function sortAchievementsByProgression(
  achievements: Array<Achievement>,
): Array<Achievement> {
  return [...achievements].sort((a, b) => {
    // Earned achievements first, then by target value
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    return a.target - b.target;
  });
}
