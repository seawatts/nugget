import type { Activities, FamilyMemberType } from '@nugget/db/schema';
import { differenceInHours } from 'date-fns';

export interface FamilyMemberScore {
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  score: number;
  feedingsLast24h: number;
  hoursSinceLastFeeding: number | null;
}

export interface SuggestedAssignment {
  suggestedMember: FamilyMemberScore | null;
  allMembers: FamilyMemberScore[];
}

/**
 * Calculate rotation score for each family member
 * Lower score = better candidate for next feeding
 */
function calculateMemberScore(
  userId: string,
  recentActivities: Array<typeof Activities.$inferSelect>,
): { feedingsLast24h: number; hoursSinceLastFeeding: number | null } {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Filter feedings by this user in last 24 hours
  const userFeedings = recentActivities.filter(
    (a) =>
      a.userId === userId &&
      (a.type === 'bottle' || a.type === 'nursing') &&
      !a.isScheduled &&
      new Date(a.startTime) >= twentyFourHoursAgo,
  );

  const feedingsLast24h = userFeedings.length;

  // Find most recent feeding by this user
  let hoursSinceLastFeeding: number | null = null;
  if (userFeedings.length > 0) {
    const sortedFeedings = userFeedings.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
    const lastFeeding = sortedFeedings[0];
    if (lastFeeding) {
      hoursSinceLastFeeding = differenceInHours(
        now,
        new Date(lastFeeding.startTime),
      );
    }
  }

  return {
    feedingsLast24h,
    hoursSinceLastFeeding,
  };
}

/**
 * Suggest which family member should do the next feeding
 * Based on:
 * - Number of feedings in last 24 hours (fewer is better)
 * - Time since their last feeding (longer is better)
 */
export function suggestFamilyMember(
  familyMembers: FamilyMemberType[],
  recentActivities: Array<typeof Activities.$inferSelect>,
): SuggestedAssignment {
  if (familyMembers.length === 0) {
    return {
      allMembers: [],
      suggestedMember: null,
    };
  }

  // Calculate scores for all family members
  const memberScores: FamilyMemberScore[] = familyMembers.map((member) => {
    const { feedingsLast24h, hoursSinceLastFeeding } = calculateMemberScore(
      member.userId,
      recentActivities,
    );

    // Score calculation:
    // - Start with feeding count (each feeding adds 10 points)
    // - Subtract points for time since last feeding (1 point per hour)
    // Lower score is better
    let score = feedingsLast24h * 10;

    if (hoursSinceLastFeeding !== null) {
      score -= hoursSinceLastFeeding;
    } else {
      // Never fed - very good candidate
      score -= 100;
    }

    // Get user info from member
    const userName = member.user
      ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() ||
        member.user.email
      : 'Unknown';
    const avatarUrl = member.user?.avatarUrl;

    return {
      avatarUrl,
      feedingsLast24h,
      hoursSinceLastFeeding,
      score,
      userId: member.userId,
      userName,
    };
  });

  // Sort by score (lowest first)
  memberScores.sort((a, b) => a.score - b.score);

  return {
    allMembers: memberScores,
    suggestedMember: memberScores[0] || null,
  };
}

/**
 * Check if a user is already assigned to a scheduled feeding
 */
export function getAssignedMember(
  scheduledFeeding: typeof Activities.$inferSelect | null,
  familyMembers: FamilyMemberType[],
): FamilyMemberScore | null {
  if (!scheduledFeeding?.assignedUserId) {
    return null;
  }

  const member = familyMembers.find(
    (m) => m.userId === scheduledFeeding.assignedUserId,
  );

  if (!member) {
    return null;
  }

  const userName = member.user
    ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() ||
      member.user.email
    : 'Unknown';

  return {
    avatarUrl: member.user?.avatarUrl,
    feedingsLast24h: 0, // Not calculated for assigned member
    hoursSinceLastFeeding: null,
    score: 0,
    userId: member.userId,
    userName,
  };
}
