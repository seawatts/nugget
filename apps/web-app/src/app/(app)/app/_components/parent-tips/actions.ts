'use server';

import { RoleSpecificTips } from '@nugget/ai/react/server';
import { getApi } from '@nugget/api/server';
import { ParentCheckIns } from '@nugget/db/schema';
import { differenceInDays, subDays } from 'date-fns';
import { and, eq, gte } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

// ============================================================================
// Types
// ============================================================================

export interface ParentTip {
  title: string;
  content: string;
  actionItems: string[];
  relevantToRole: string;
}

export interface TipsOutput {
  tips: ParentTip[];
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Get role-specific tips for a parent
 */
export const getRoleSpecificTipsAction = action
  .schema(
    z.object({
      topic: z
        .enum([
          'sleep_deprivation',
          'postpartum_recovery',
          'partner_support',
          'mental_health_support',
          'feeding_support',
          'general',
        ])
        .default('general'),
      userId: z.string(),
    }),
  )
  .action(async ({ parsedInput }): Promise<TipsOutput> => {
    const api = await getApi();

    if (!ctx.auth?.orgId) {
      throw new Error('Authentication required.');
    }

    const { orgId } = ctx.auth;

    // Get baby data
    const baby = await api.db.query.Babies.findFirst({
      orderBy: (babies, { desc }) => [desc(babies.birthDate)],
      where: (babies, { eq }) => eq(babies.familyId, orgId),
    });

    if (!baby || !baby.birthDate) {
      return {
        tips: [],
      };
    }

    const babyAgeInDays = differenceInDays(new Date(), baby.birthDate);
    const ppDay = babyAgeInDays;

    // Get parent's role
    const familyMember = await api.db.query.FamilyMembers.findFirst({
      where: (members, { and, eq }) =>
        and(
          eq(members.userId, parsedInput.userId),
          eq(members.familyId, orgId),
        ),
    });

    const parentRole = familyMember?.userRole ?? 'primary';

    // Get parent's recent sleep hours
    const sevenDaysAgo = subDays(new Date(), 7);
    const sleepActivities = await api.db.query.Activities.findMany({
      where: (activities, { and, eq, gte }) =>
        and(
          eq(activities.familyId, orgId),
          eq(activities.userId, parsedInput.userId),
          eq(activities.type, 'sleep'),
          gte(activities.startTime, sevenDaysAgo),
        ),
    });

    const recentSleepHours =
      sleepActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / 3600;

    // Get recent concerns from check-ins
    const recentCheckIns = await api.db.query.ParentCheckIns.findMany({
      limit: 5,
      orderBy: (checkIns, { desc }) => [desc(checkIns.date)],
      where: and(
        eq(ParentCheckIns.familyId, orgId),
        eq(ParentCheckIns.userId, parsedInput.userId),
        gte(ParentCheckIns.date, sevenDaysAgo),
      ),
    });

    const concerns: string[] = [];
    recentCheckIns.forEach((checkIn) => {
      const checkInConcerns = (checkIn.concernsRaised as string[]) ?? [];
      concerns.push(...checkInConcerns);
    });

    // Remove duplicates
    const uniqueConcerns = [...new Set(concerns)];

    // Call BAML function
    const bamlResult = await RoleSpecificTips(
      parentRole,
      ppDay,
      babyAgeInDays,
      parsedInput.topic,
      recentSleepHours,
      uniqueConcerns.length > 0 ? uniqueConcerns : null,
    );

    return {
      tips: bamlResult.tips.map((tip) => ({
        actionItems: tip.actionItems,
        content: tip.content,
        relevantToRole: tip.relevantToRole,
        title: tip.title,
      })),
    };
  });
