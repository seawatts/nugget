/**
 * Well-baby checkup schedule based on AAP (American Academy of Pediatrics) recommendations
 * These are the standard recommended visit ages during the first year
 */

export interface ScheduledVisit {
  /** Age in days when visit is due */
  ageDays: number;
  /** Display label for the visit */
  label: string;
  /** Short description of what to expect */
  description: string;
  /** Common vaccinations at this visit */
  commonVaccinations: string[];
}

/**
 * Standard well-baby visit schedule for the first year
 * Based on AAP Bright Futures guidelines
 */
export const WELL_BABY_SCHEDULE: ScheduledVisit[] = [
  {
    ageDays: 4, // 3-5 days
    commonVaccinations: [],
    description:
      'First newborn checkup. Weight check, feeding assessment, jaundice screening.',
    label: 'Newborn (3-5 days)',
  },
  {
    ageDays: 14, // 2 weeks
    commonVaccinations: [],
    description:
      'Weight and feeding check, developmental assessment, parental support.',
    label: '2 Week',
  },
  {
    ageDays: 30, // 1 month
    commonVaccinations: ['Hepatitis B (if not given at birth)'],
    description:
      'Growth check, developmental milestones, feeding patterns, sleep habits.',
    label: '1 Month',
  },
  {
    ageDays: 60, // 2 months
    commonVaccinations: [
      'DTaP',
      'IPV',
      'Hib',
      'PCV13',
      'Rotavirus',
      'Hepatitis B',
    ],
    description:
      'First major vaccination appointment. Developmental screening, growth assessment.',
    label: '2 Month',
  },
  {
    ageDays: 120, // 4 months
    commonVaccinations: ['DTaP', 'IPV', 'Hib', 'PCV13', 'Rotavirus'],
    description:
      'Second vaccination round. Motor skill development, introduction to solids discussion.',
    label: '4 Month',
  },
  {
    ageDays: 180, // 6 months
    commonVaccinations: [
      'DTaP',
      'IPV',
      'Hib',
      'PCV13',
      'Rotavirus',
      'Hepatitis B',
      'Influenza (seasonal)',
    ],
    description:
      'Third vaccination round. Solid food introduction, sitting milestones, dental care.',
    label: '6 Month',
  },
  {
    ageDays: 270, // 9 months
    commonVaccinations: ['Influenza (if in flu season)'],
    description:
      'Crawling assessment, fine motor skills, food variety, safety proofing discussion.',
    label: '9 Month',
  },
  {
    ageDays: 365, // 12 months
    commonVaccinations: ['MMR', 'Varicella', 'Hepatitis A', 'PCV13', 'Hib'],
    description:
      'First birthday checkup! Walking assessment, language development, nutrition transition.',
    label: '12 Month (1 Year)',
  },
];

/**
 * Calculate the date when a specific visit is due based on baby's birth date
 */
export function getVisitDueDate(birthDate: Date, visitAgeDays: number): Date {
  const dueDate = new Date(birthDate);
  dueDate.setDate(dueDate.getDate() + visitAgeDays);
  return dueDate;
}

/**
 * Get all scheduled visits with their due dates
 */
export function getAllScheduledVisits(
  birthDate: Date | null,
): Array<ScheduledVisit & { dueDate: Date; isPast: boolean }> {
  if (!birthDate) return [];

  const now = new Date();

  return WELL_BABY_SCHEDULE.map((visit) => {
    const dueDate = getVisitDueDate(birthDate, visit.ageDays);
    const isPast = dueDate < now;

    return {
      ...visit,
      dueDate,
      isPast,
    };
  });
}

/**
 * Get the next scheduled visit that hasn't been completed
 */
export function getNextScheduledVisit(
  birthDate: Date | null,
  completedVisitDates: Date[],
): (ScheduledVisit & { dueDate: Date; daysUntil: number }) | null {
  if (!birthDate) return null;

  const now = new Date();
  const allVisits = getAllScheduledVisits(birthDate);

  // Find the next visit that:
  // 1. Is due (dueDate is in the past or within next 14 days)
  // 2. Hasn't been completed (no visit within ±30 days of due date)
  for (const visit of allVisits) {
    const { dueDate } = visit;
    const daysUntil = Math.floor(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Check if this visit has been completed
    // A visit is considered completed if there's a visit within ±30 days of the due date
    // We use a 30-day window (vs 7-day grace period for overdue) because checkups
    // are often delayed but should still count toward the visit when logged
    const isCompleted = completedVisitDates.some((completedDate) => {
      const daysDiff = Math.abs(
        (completedDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysDiff <= 30;
    });

    // If not completed and either past due or due within next 14 days, return it
    if (!isCompleted && daysUntil <= 14) {
      return {
        ...visit,
        daysUntil,
        dueDate,
      };
    }
  }

  return null;
}

/**
 * Check if a visit is overdue
 */
export function isVisitOverdue(dueDate: Date, gracePeriodDays = 7): boolean {
  const now = new Date();
  const daysPastDue = Math.floor(
    (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  return daysPastDue > gracePeriodDays;
}

/**
 * Get visit schedule context for display
 */
export function getVisitScheduleContext(
  birthDate: Date | null,
  completedVisitDates: Date[],
): {
  nextVisit: (ScheduledVisit & { dueDate: Date; daysUntil: number }) | null;
  totalScheduled: number;
  totalCompleted: number;
  allVisits: Array<ScheduledVisit & { dueDate: Date; isPast: boolean }>;
} {
  const allVisits = getAllScheduledVisits(birthDate);
  const nextVisit = getNextScheduledVisit(birthDate, completedVisitDates);

  // Count completed visits
  // Use same 30-day matching window as getNextScheduledVisit for consistency
  const totalCompleted = allVisits.filter((visit) => {
    return completedVisitDates.some((completedDate) => {
      const daysDiff = Math.abs(
        (completedDate.getTime() - visit.dueDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return daysDiff <= 30;
    });
  }).length;

  return {
    allVisits,
    nextVisit,
    totalCompleted,
    totalScheduled: WELL_BABY_SCHEDULE.length,
  };
}
