import type { Activities } from '@nugget/db/schema';
import type { FeedingFormData } from '../feeding-type-selector';

interface NursingDetails {
  side: 'left' | 'right' | 'both';
  type: 'nursing';
}

interface SolidsItem {
  foodName: string;
  reaction:
    | 'none'
    | 'liked'
    | 'disliked'
    | 'allergic'
    | 'rash'
    | 'vomiting'
    | 'other';
  allergenInfo?: string;
  notes?: string;
  portion?: string;
}

interface SolidsDetails {
  items: SolidsItem[];
  type: 'solids';
}

type FeedingDetails = NursingDetails | SolidsDetails | null;

interface BaseActivityData {
  startTime: Date;
  endTime: Date;
  notes?: string;
}

interface CreateActivityData extends BaseActivityData {
  activityType: typeof Activities.$inferSelect.type;
  amount?: number;
  duration?: number;
  feedingSource?: typeof Activities.$inferSelect.feedingSource;
  details?: FeedingDetails;
}

interface UpdateActivityData extends BaseActivityData {
  id: string;
  amount?: number;
  duration?: number;
  feedingSource?: typeof Activities.$inferSelect.feedingSource;
  details?: FeedingDetails;
}

/**
 * Calculate duration in minutes between two dates
 */
export function calculateDurationMinutes(
  startTime: Date,
  endTime: Date,
): number {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60);
}

/**
 * Build feeding source from form data
 */
function getFeedingSource(
  formData: FeedingFormData,
): typeof Activities.$inferSelect.feedingSource {
  switch (formData.type) {
    case 'bottle':
      return formData.bottleType === 'formula'
        ? ('formula' as const)
        : ('pumped' as const);
    case 'nursing':
      return 'direct' as const;
    default:
      return null;
  }
}

/**
 * Build details object from form data
 */
function getDetails(formData: FeedingFormData): FeedingDetails {
  switch (formData.type) {
    case 'nursing':
      return { side: 'both' as const, type: 'nursing' as const };
    case 'solids':
      return { items: [], type: 'solids' as const };
    default:
      return null;
  }
}

/**
 * Build create activity data from form data
 */
export function buildCreateActivityData(
  formData: FeedingFormData,
  baseData: BaseActivityData,
  durationMinutes: number,
): CreateActivityData {
  const common = {
    ...baseData,
    activityType: formData.type as typeof Activities.$inferSelect.type,
    feedingSource: getFeedingSource(formData),
    notes: formData.notes || undefined,
  };

  switch (formData.type) {
    case 'bottle':
      return {
        ...common,
        amount: formData.amountMl,
        details: null,
      };
    case 'nursing':
      return {
        ...common,
        amount: formData.amountMl,
        details: getDetails(formData),
        duration: durationMinutes,
      };
    case 'solids':
      return {
        ...common,
        details: getDetails(formData),
      };
    default:
      return common;
  }
}

/**
 * Build update activity data from form data
 */
export function buildUpdateActivityData(
  formData: FeedingFormData,
  baseData: BaseActivityData,
  activityId: string,
  durationMinutes: number,
): UpdateActivityData {
  const common = {
    ...baseData,
    feedingSource: getFeedingSource(formData),
    id: activityId,
    notes: formData.notes || undefined,
  };

  switch (formData.type) {
    case 'bottle':
      return {
        ...common,
        amount: formData.amountMl,
        details: null,
      };
    case 'nursing':
      return {
        ...common,
        amount: formData.amountMl,
        details: getDetails(formData),
        duration: durationMinutes,
      };
    case 'solids':
      return {
        ...common,
        details: getDetails(formData),
      };
    default:
      return common;
  }
}

/**
 * Build optimistic activity for immediate UI feedback
 */
export function buildOptimisticActivity(
  formData: FeedingFormData,
  startTime: Date,
  endTime: Date,
  durationMinutes: number,
): typeof Activities.$inferSelect {
  return {
    amount:
      formData.type === 'bottle'
        ? formData.amountMl
        : (formData.amountMl ?? null),
    assignedUserId: null,
    babyId: 'temp',
    createdAt: startTime,
    details: getDetails(formData),
    duration: formData.type === 'nursing' ? durationMinutes : null,
    endTime,
    familyId: 'temp',
    familyMemberId: null,
    feedingSource: getFeedingSource(formData),
    id: `optimistic-feeding-${Date.now()}`,
    isScheduled: false,
    notes: formData.notes || null,
    startTime,
    subjectType: 'baby' as const,
    type: 'feeding' as const,
    updatedAt: startTime,
    userId: 'temp',
  } as typeof Activities.$inferSelect;
}
