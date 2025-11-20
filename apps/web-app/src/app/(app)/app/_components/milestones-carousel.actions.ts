'use server';

import { auth } from '@clerk/nextjs/server';
import { generateMilestoneSuggestions } from '@nugget/ai';
import { getApi } from '@nugget/api/server';
import { db } from '@nugget/db/client';
import { type Baby, Milestones } from '@nugget/db/schema';
import { differenceInDays, differenceInWeeks } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { getDateKey, withCache } from './shared/carousel-cache-helper';

export interface MilestoneCardData {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  type: 'physical' | 'cognitive' | 'social' | 'language' | 'self_care';
  ageLabel: string;
  suggestedDay: number;
  isCompleted: boolean;
  bulletPoints?: string[];
  followUpQuestion?: string;
  summary?: string;
  isYesNoQuestion?: boolean;
  openChatOnYes?: boolean;
  openChatOnNo?: boolean;
}

interface MilestonesCarouselData {
  baby: Baby | null;
  babyName: string;
  ageInDays: number;
  milestones: MilestoneCardData[];
}

/**
 * Get milestones carousel content with cache-first loading
 * Simple, focused approach: check cache → generate if needed → return
 */
export async function getMilestonesCarouselContent(
  babyId: string,
): Promise<MilestonesCarouselData> {
  try {
    const authResult = await auth();
    if (!authResult.userId) {
      console.error('[Milestones] No authenticated user');
      return {
        ageInDays: 0,
        baby: null,
        babyName: 'Baby',
        milestones: [],
      };
    }

    // Get baby data
    const api = await getApi();
    const babies = await api.babies.list();
    const baby = babies.find((b) => b.id === babyId) || babies[0];

    if (!baby || !baby.birthDate) {
      console.error('[Milestones] No baby or birth date found');
      return {
        ageInDays: 0,
        baby: null,
        babyName: 'Baby',
        milestones: [],
      };
    }

    const ageInDays = differenceInDays(new Date(), baby.birthDate);
    const ageInWeeks = differenceInWeeks(new Date(), baby.birthDate);

    console.log('[Milestones] Baby age:', { ageInDays, ageInWeeks });

    // Get completed milestones
    const completedMilestones = await db
      .select()
      .from(Milestones)
      .where(
        and(eq(Milestones.babyId, baby.id), eq(Milestones.isSuggested, true)),
      )
      .execute();

    const completedTitles = new Set(
      completedMilestones
        .filter((m) => m.achievedDate !== null)
        .map((m) => m.title),
    );

    // Cache key based on age and date
    const dateKey = await getDateKey();
    const cacheKey = `milestones:${baby.id}:day${ageInDays}:${dateKey}`;

    // Use cache-first helper
    const generatedMilestones = await withCache<
      Array<{
        title: string;
        type: string;
        ageLabel: string;
        subtitle: string;
        summary: string;
        bulletPoints: string[];
        followUpQuestion: string;
        isYesNoQuestion?: boolean;
        openChatOnYes?: boolean;
        openChatOnNo?: boolean;
      }>
    >({
      babyId: baby.id,
      cacheKey,
      familyId: baby.familyId || authResult.orgId || '',
      generate: async () => {
        console.log('[Milestones] Generating AI content...');

        // Call AI orchestrator (both plan and execution)
        const result = await generateMilestoneSuggestions({
          achievedMilestones: completedMilestones.map((m) => ({
            achievedAt: m.achievedDate ?? new Date(),
            id: m.id,
            title: m.title,
          })),
          activityTrends: undefined,
          ageInDays,
          ageInWeeks,
          avgDiaperChangesPerDay: undefined,
          avgFeedingInterval: undefined,
          avgFeedingsPerDay: undefined,
          avgSleepHoursPerDay: undefined,
          babyName: baby.firstName ?? 'Baby',
          babySex: baby.gender ?? undefined,
          birthWeightOz: baby.birthWeightOz ?? undefined,
          currentWeightOz: baby.currentWeightOz ?? undefined,
          diaperCount24h: undefined,
          feedingCount24h: undefined,
          hasTummyTimeActivity: undefined,
          height: undefined,
          medicalRecords: undefined,
          recentChatMessages: undefined,
          recentlySuggestedMilestones: undefined,
          sleepCount24h: undefined,
          totalSleepHours24h: undefined,
        });

        // Use the full milestone details (from execution phase) plus plan metadata
        return result.milestones.slice(0, 5).map((milestone, index) => {
          const planItem = result.plan.items[index];
          return {
            ageLabel: planItem?.ageLabel || `Day ${ageInDays}`,
            bulletPoints: milestone.bulletPoints,
            followUpQuestion: milestone.followUpQuestion,
            isYesNoQuestion: milestone.isYesNoQuestion ?? true,
            openChatOnNo: milestone.openChatOnNo ?? undefined,
            openChatOnYes: milestone.openChatOnYes ?? undefined,
            subtitle: milestone.subtitle,
            summary: milestone.summary,
            title: planItem?.title || 'Milestone',
            type: planItem?.type || 'physical',
          };
        });
      },
      ttlMs: 86400000, // 1 day
    });

    // Map to milestone card data
    const milestones: MilestoneCardData[] = (generatedMilestones || []).map(
      (item, index) => ({
        ageLabel: item.ageLabel,
        bulletPoints: item.bulletPoints,
        description: item.summary,
        followUpQuestion: item.followUpQuestion,
        id: `milestone-${index}-${item.title.toLowerCase().replace(/\s+/g, '-')}`,
        isCompleted: completedTitles.has(item.title),
        isYesNoQuestion: item.isYesNoQuestion,
        openChatOnNo: item.openChatOnNo,
        openChatOnYes: item.openChatOnYes,
        subtitle: item.subtitle,
        suggestedDay: ageInDays,
        summary: item.summary,
        title: item.title,
        type: item.type as MilestoneCardData['type'],
      }),
    );

    console.log('[Milestones] Returning result:', {
      hasBaby: !!baby,
      milestonesCount: milestones.length,
    });

    return {
      ageInDays,
      baby,
      babyName: baby.firstName ?? 'Baby',
      milestones,
    };
  } catch (error) {
    console.error('[Milestones] Error:', error);
    return {
      ageInDays: 0,
      baby: null,
      babyName: 'Baby',
      milestones: [],
    };
  }
}
