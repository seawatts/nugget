import type { Activities } from '@nugget/db/schema';
import {
  getNextScheduledVisit,
  getVisitScheduleContext,
  isVisitOverdue,
  type ScheduledVisit,
} from './doctor-visit-schedule';

export interface DoctorVisitPrediction {
  /** Next scheduled visit info */
  nextVisit: (ScheduledVisit & { dueDate: Date; daysUntil: number }) | null;
  /** Is the visit overdue */
  isOverdue: boolean;
  /** How many minutes overdue (null if not overdue) */
  overdueDays: number | null;
  /** Confidence level of prediction */
  confidenceLevel: 'low' | 'medium' | 'high';
  /** Date of last doctor visit */
  lastVisitDate: Date | null;
  /** Total number of visits in first year schedule */
  totalScheduled: number;
  /** Number of completed visits */
  totalCompleted: number;
  /** All scheduled visits with status */
  allVisits: Array<ScheduledVisit & { dueDate: Date; isPast: boolean }>;
}

/**
 * Calculate baby's age in days from birth date
 */
function calculateBabyAgeDays(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const now = new Date();
  const diffTime = now.getTime() - birthDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Predict next doctor visit based on baby's age and visit history
 * Combines standard AAP schedule with completed visits
 */
export function predictNextDoctorVisit(
  recentActivities: Array<typeof Activities.$inferSelect>,
  babyBirthDate: Date | null,
): DoctorVisitPrediction {
  // Filter to only doctor visit activities
  const doctorVisitActivities = recentActivities
    .filter((a) => a.type === 'doctor_visit')
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    ); // Most recent first

  // Get completed visit dates
  const completedVisitDates = doctorVisitActivities.map(
    (a) => new Date(a.startTime),
  );

  // Get last visit
  const lastVisit = doctorVisitActivities[0];
  const lastVisitDate = lastVisit ? new Date(lastVisit.startTime) : null;

  // Get visit schedule context
  const scheduleContext = getVisitScheduleContext(
    babyBirthDate,
    completedVisitDates,
  );

  // Get next scheduled visit
  const nextVisit = getNextScheduledVisit(babyBirthDate, completedVisitDates);

  // Determine if overdue
  let isOverdue = false;
  let overdueDays: number | null = null;

  if (nextVisit) {
    const now = new Date();
    isOverdue = isVisitOverdue(nextVisit.dueDate, 7); // 7 day grace period

    if (isOverdue) {
      overdueDays = Math.floor(
        (now.getTime() - nextVisit.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
    }
  }

  // Determine confidence level
  let confidenceLevel: 'low' | 'medium' | 'high' = 'high';

  if (!babyBirthDate) {
    confidenceLevel = 'low';
  } else if (doctorVisitActivities.length === 0) {
    // No visit history, but we have birth date
    confidenceLevel = 'medium';
  } else {
    // Have visit history and birth date
    confidenceLevel = 'high';
  }

  return {
    allVisits: scheduleContext.allVisits,
    confidenceLevel,
    isOverdue,
    lastVisitDate,
    nextVisit,
    overdueDays,
    totalCompleted: scheduleContext.totalCompleted,
    totalScheduled: scheduleContext.totalScheduled,
  };
}

/**
 * Format the next visit message for display
 */
export function formatNextVisitMessage(
  prediction: DoctorVisitPrediction,
): string {
  if (!prediction.nextVisit) {
    if (prediction.totalCompleted >= prediction.totalScheduled) {
      return 'All first-year checkups completed!';
    }
    return 'No upcoming visits scheduled';
  }

  const { label, daysUntil } = prediction.nextVisit;

  if (prediction.isOverdue && prediction.overdueDays) {
    if (prediction.overdueDays === 1) {
      return `${label} checkup was due yesterday`;
    }
    return `${label} checkup was due ${prediction.overdueDays} days ago`;
  }

  if (daysUntil === 0) {
    return `${label} checkup is due today`;
  }

  if (daysUntil === 1) {
    return `${label} checkup is due tomorrow`;
  }

  if (daysUntil < 0) {
    // Past due but within grace period
    return `${label} checkup is due`;
  }

  if (daysUntil <= 7) {
    return `${label} checkup in ${daysUntil} days`;
  }

  if (daysUntil <= 14) {
    return `${label} checkup in ${Math.floor(daysUntil / 7)} week${Math.floor(daysUntil / 7) > 1 ? 's' : ''}`;
  }

  const weeks = Math.floor(daysUntil / 7);
  return `${label} checkup in ${weeks} weeks`;
}

/**
 * Get visit progress summary
 */
export function getVisitProgress(prediction: DoctorVisitPrediction): {
  completed: number;
  total: number;
  percentage: number;
  nextLabel: string | null;
} {
  const completed = prediction.totalCompleted;
  const total = prediction.totalScheduled;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const nextLabel = prediction.nextVisit?.label || null;

  return {
    completed,
    nextLabel,
    percentage,
    total,
  };
}
