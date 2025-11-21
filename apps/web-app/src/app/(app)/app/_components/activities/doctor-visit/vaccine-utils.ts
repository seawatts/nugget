import {
  type ScheduledVisit,
  WELL_BABY_SCHEDULE,
} from './doctor-visit-schedule';

export interface VaccineCategory {
  /** Vaccines recommended for the current age */
  recommended: string[];
  /** Vaccines that have already been given */
  alreadyGiven: string[];
  /** All unique vaccines from history (for reference) */
  allHistorical: string[];
}

/**
 * Get the closest scheduled visit for a given age in days
 * This helps determine which vaccines are age-appropriate
 */
export function getClosestScheduledVisit(
  ageDays: number,
): ScheduledVisit | null {
  if (ageDays < 0) return null;

  // Find the visit that matches this age most closely
  // We'll look for visits within ±30 days of the current age
  const MATCH_WINDOW_DAYS = 30;

  let closestVisit: ScheduledVisit | null = null;
  let smallestDiff = Number.POSITIVE_INFINITY;

  for (const visit of WELL_BABY_SCHEDULE) {
    const diff = Math.abs(visit.ageDays - ageDays);

    // If this visit is within the match window and closer than previous best
    if (diff <= MATCH_WINDOW_DAYS && diff < smallestDiff) {
      closestVisit = visit;
      smallestDiff = diff;
    }
  }

  // If no close match, find the next upcoming visit
  if (!closestVisit) {
    for (const visit of WELL_BABY_SCHEDULE) {
      if (visit.ageDays >= ageDays) {
        closestVisit = visit;
        break;
      }
    }
  }

  return closestVisit;
}

/**
 * Get vaccines that are recommended for a specific age
 * based on the well-baby schedule
 */
export function getRecommendedVaccinesForAge(ageDays: number): string[] {
  const closestVisit = getClosestScheduledVisit(ageDays);

  if (!closestVisit || closestVisit.commonVaccinations.length === 0) {
    return [];
  }

  return closestVisit.commonVaccinations;
}

/**
 * Extract all vaccines from vaccination history
 * Handles both MedicalRecords entries and doctor visit activity details
 */
export function extractVaccinesFromHistory(
  medicalRecords: Array<{ vaccinations: string[] | null }>,
  doctorVisitActivities: Array<{
    details: {
      vaccinations?: string[];
    } | null;
  }>,
): string[] {
  const allVaccines = new Set<string>();

  // Extract from medical records
  for (const record of medicalRecords) {
    if (record.vaccinations) {
      for (const vaccine of record.vaccinations) {
        allVaccines.add(vaccine);
      }
    }
  }

  // Extract from doctor visit activities
  for (const activity of doctorVisitActivities) {
    if (activity.details?.vaccinations) {
      for (const vaccine of activity.details.vaccinations) {
        allVaccines.add(vaccine);
      }
    }
  }

  return Array.from(allVaccines);
}

/**
 * Categorize vaccines based on baby's age and vaccination history
 */
export function categorizeVaccines(
  ageDays: number | null,
  vaccinationHistory: string[],
): VaccineCategory {
  // If no age provided, return empty categories
  if (ageDays === null || ageDays < 0) {
    return {
      allHistorical: vaccinationHistory,
      alreadyGiven: vaccinationHistory,
      recommended: [],
    };
  }

  // Get age-appropriate vaccines
  const recommended = getRecommendedVaccinesForAge(ageDays);

  // Separate already given from recommended
  const alreadyGiven = vaccinationHistory.filter((vaccine) =>
    recommended.includes(vaccine),
  );

  return {
    allHistorical: vaccinationHistory,
    alreadyGiven,
    recommended,
  };
}

/**
 * Get display information for a vaccine button
 */
export function getVaccineDisplayInfo(
  vaccine: string,
  isSelected: boolean,
  alreadyGiven: boolean,
): {
  label: string;
  showBadge: boolean;
  badgeText: string;
  className: string;
} {
  return {
    badgeText: 'Previously Given',
    className: alreadyGiven && !isSelected ? 'opacity-60' : '',
    label: vaccine,
    showBadge: alreadyGiven,
  };
}
