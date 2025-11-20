'use server';

import { auth } from '@clerk/nextjs/server';
import { generateDailyLearning } from '@nugget/ai';
import { getApi } from '@nugget/api/server';
import type { Baby } from '@nugget/db/schema';
import { differenceInDays, differenceInWeeks } from 'date-fns';
import { getDateKey, withCache } from './shared/carousel-cache-helper';

export interface LearningTip {
  category: string;
  subtitle: string;
  summary: string;
  bulletPoints: string[];
  followUpQuestion: string;
  isYesNoQuestion?: boolean;
  openChatOnYes?: boolean;
  openChatOnNo?: boolean;
}

interface LearningCarouselData {
  baby: Baby | null;
  tips: LearningTip[];
  status: 'loading' | 'pending' | 'ready' | 'empty';
}

/**
 * Get learning carousel content with cache-first loading
 * Simple, focused approach: check cache → generate if needed → return
 */
export async function getLearningCarouselContent(
  babyId: string,
): Promise<LearningCarouselData> {
  try {
    const authResult = await auth();
    if (!authResult.userId) {
      console.error('[Learning] No authenticated user');
      return { baby: null, status: 'empty', tips: [] };
    }

    // Get baby data
    const api = await getApi();
    const baby = await api.babies.getById({ id: babyId });

    if (!baby || !baby.birthDate) {
      console.error('[Learning] No baby or birth date found');
      return { baby: null, status: 'empty', tips: [] };
    }

    const ageInDays = differenceInDays(new Date(), baby.birthDate);
    const ageInWeeks = differenceInWeeks(new Date(), baby.birthDate);

    console.log('[Learning] Baby age:', { ageInDays, ageInWeeks });

    // Cache key based on age and date
    const dateKey = await getDateKey();
    const cacheKey = `learning:${baby.id}:day${ageInDays}:${dateKey}`;

    // Use cache-first helper
    const tips = await withCache<LearningTip[]>({
      babyId: baby.id,
      cacheKey,
      familyId: baby.familyId || authResult.orgId || '',
      generate: async () => {
        console.log('[Learning] Generating AI content...');

        // Call AI orchestrator
        const result = await generateDailyLearning({
          achievedMilestones: null,
          activitySummary: null,
          ageInDays,
          ageInWeeks,
          avgDiaperChangesPerDay: null,
          avgFeedingInterval: null,
          avgFeedingsPerDay: null,
          avgSleepHoursPerDay: null,
          babyName: baby.firstName ?? 'Baby',
          babySex: baby.gender ?? null,
          birthWeightOz: baby.birthWeightOz ?? null,
          currentWeightOz: baby.currentWeightOz ?? null,
          diaperCount24h: null,
          feedingCount24h: null,
          firstTimeParent: false,
          height: null,
          medicalContext: null,
          parentWellness: null,
          recentChatTopics: null,
          recentlyCoveredTopics: null,
          sleepCount24h: null,
          totalSleepHours24h: null,
        });

        // Map to convert null to undefined for optional boolean fields
        return result.tips.map((tip) => ({
          ...tip,
          isYesNoQuestion: tip.isYesNoQuestion ?? undefined,
          openChatOnNo: tip.openChatOnNo ?? undefined,
          openChatOnYes: tip.openChatOnYes ?? undefined,
        }));
      },
      ttlMs: 86400000, // 1 day
    });

    console.log('[Learning] Returning result:', {
      hasBaby: !!baby,
      isPending: tips === null,
      tipsCount: tips?.length || 0,
    });

    // Determine status based on result
    let status: 'loading' | 'pending' | 'ready' | 'empty';
    if (tips === null) {
      status = 'pending'; // Cache is generating
    } else if (tips.length === 0) {
      status = 'empty'; // No content available
    } else {
      status = 'ready'; // Content is ready
    }

    return {
      baby,
      status,
      tips: tips || [],
    };
  } catch (error) {
    console.error('[Learning] Error:', error);
    return { baby: null, status: 'empty', tips: [] };
  }
}
