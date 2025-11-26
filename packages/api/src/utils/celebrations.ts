/**
 * Celebration utility functions
 * Shared between the API router and web-app components
 */

import type { CelebrationEnhancementContext } from '@nugget/ai/celebration-orchestrator';
import { enhanceCelebration } from '@nugget/ai/celebration-orchestrator';
import {
  createCelebrationsProgram,
  evalCond,
  type Rule,
  type RuleContext,
  Scope,
  Screen,
  Slot,
} from '@nugget/content-rules';
import { db } from '@nugget/db/client';
import {
  Activities,
  type Babies,
  CelebrationMemories,
  type celebrationTypeEnum,
} from '@nugget/db/schema';
import { createId } from '@nugget/id';
import { differenceInDays, subDays } from 'date-fns';
import { and, eq, gte } from 'drizzle-orm';

// Type for celebration type values
type CelebrationType = (typeof celebrationTypeEnum.enumValues)[number];

export interface CelebrationCardData {
  id: string;
  title: string;
  type: 'celebration';
  ageLabel: string;
  celebrationType: string;
  statistics: {
    ageInDays: number;
    ageLabel: string;
    feedingCount?: number;
    sleepHours?: number;
    diaperCount?: number;
    weightGain?: string;
  };
  actions: Array<{
    type: 'save_memory' | 'take_photo' | 'share';
    label: string;
  }>;
  showPhotoUpload: boolean;
  memory?: {
    id: string;
    note: string | null;
    photoUrls: string[];
    sharedWith: string[];
  };
  aiSummary?: string;
  aiQuestions?: {
    milestone: { question: string; systemPrompt: string };
    memory: { question: string; systemPrompt: string };
    guidance: { question: string; systemPrompt: string };
  };
}

export interface CelebrationCarouselData {
  celebration: CelebrationCardData | null;
  babyName: string;
  ageInDays: number;
  baby: typeof Babies.$inferSelect | null;
  aiContext?: CelebrationEnhancementContext & { celebrationMemoryId: string };
  nextCelebration?: {
    day: number;
    title: string;
    shouldShow: boolean;
  };
}

const CELEBRATION_MILESTONES = [
  {
    ageLabel: '1 Week Old!',
    day: 7,
    title: '🎉 Happy 1 Week Birthday!',
    type: 'week_1',
  },
  {
    ageLabel: '2 Weeks Old!',
    day: 14,
    title: '🎉 Happy 2 Week Birthday!',
    type: 'week_2',
  },
  {
    ageLabel: '3 Weeks Old!',
    day: 21,
    title: '🎉 Happy 3 Week Birthday!',
    type: 'week_3',
  },
  {
    ageLabel: '4 Weeks Old!',
    day: 28,
    title: '🎉 Happy 4 Week Birthday!',
    type: 'week_4',
  },
  {
    ageLabel: '1 Month Old!',
    day: 30,
    title: '🎂 Happy 1 Month Birthday!',
    type: 'month_1',
  },
  {
    ageLabel: '5 Weeks Old!',
    day: 35,
    title: '🎉 Happy 5 Week Birthday!',
    type: 'week_5',
  },
  {
    ageLabel: '6 Weeks Old!',
    day: 42,
    title: '🎉 Happy 6 Week Birthday!',
    type: 'week_6',
  },
  {
    ageLabel: '7 Weeks Old!',
    day: 49,
    title: '🎉 Happy 7 Week Birthday!',
    type: 'week_7',
  },
  {
    ageLabel: '8 Weeks Old!',
    day: 56,
    title: '🎉 Happy 8 Week Birthday!',
    type: 'week_8',
  },
  {
    ageLabel: '2 Months Old!',
    day: 60,
    title: '🎂 Happy 2 Month Birthday!',
    type: 'month_2',
  },
  {
    ageLabel: '9 Weeks Old!',
    day: 63,
    title: '🎉 Happy 9 Week Birthday!',
    type: 'week_9',
  },
  {
    ageLabel: '10 Weeks Old!',
    day: 70,
    title: '🎉 Happy 10 Week Birthday!',
    type: 'week_10',
  },
  {
    ageLabel: '11 Weeks Old!',
    day: 77,
    title: '🎉 Happy 11 Week Birthday!',
    type: 'week_11',
  },
  {
    ageLabel: '12 Weeks Old!',
    day: 84,
    title: '🎉 Happy 12 Week Birthday!',
    type: 'week_12',
  },
  {
    ageLabel: '3 Months Old!',
    day: 90,
    title: '🎂 Happy 3 Month Birthday!',
    type: 'month_3',
  },
  {
    ageLabel: '4 Months Old!',
    day: 120,
    title: '🎂 Happy 4 Month Birthday!',
    type: 'month_4',
  },
  {
    ageLabel: '5 Months Old!',
    day: 150,
    title: '🎂 Happy 5 Month Birthday!',
    type: 'month_5',
  },
  {
    ageLabel: '6 Months Old!',
    day: 180,
    title: '🎂 Happy 6 Month Birthday!',
    type: 'month_6',
  },
  {
    ageLabel: '7 Months Old!',
    day: 210,
    title: '🎂 Happy 7 Month Birthday!',
    type: 'month_7',
  },
  {
    ageLabel: '8 Months Old!',
    day: 240,
    title: '🎂 Happy 8 Month Birthday!',
    type: 'month_8',
  },
  {
    ageLabel: '9 Months Old!',
    day: 270,
    title: '🎂 Happy 9 Month Birthday!',
    type: 'month_9',
  },
  {
    ageLabel: '10 Months Old!',
    day: 300,
    title: '🎂 Happy 10 Month Birthday!',
    type: 'month_10',
  },
  {
    ageLabel: '11 Months Old!',
    day: 330,
    title: '🎂 Happy 11 Month Birthday!',
    type: 'month_11',
  },
  {
    ageLabel: '1 Year Old!',
    day: 365,
    title: '🎂🎉 Happy 1st Birthday!',
    type: 'year_1',
  },
  {
    ageLabel: '18 Months Old!',
    day: 547,
    title: '🎂 Happy 18 Month Birthday!',
    type: 'month_18',
  },
  {
    ageLabel: '2 Years Old!',
    day: 730,
    title: '🎂🎉 Happy 2nd Birthday!',
    type: 'year_2',
  },
].sort((a, b) => a.day - b.day);

/**
 * Find the next upcoming celebration milestone
 */
function findNextCelebration(currentAgeInDays: number) {
  return CELEBRATION_MILESTONES.find(
    (milestone) => milestone.day > currentAgeInDays,
  );
}

/**
 * Determine if we should show the "coming soon" card based on age and proximity
 */
function shouldShowComingSoon(
  currentAgeInDays: number,
  nextCelebrationDay: number,
): boolean {
  const daysUntil = nextCelebrationDay - currentAgeInDays;

  // For weekly celebrations (days 0-84): show if within 3 days
  if (currentAgeInDays < 85) {
    return daysUntil <= 3 && daysUntil > 0;
  }

  // For monthly celebrations (day 85+): show if within 10 days
  return daysUntil <= 10 && daysUntil > 0;
}

/**
 * Calculate baby activity statistics for the past 24 hours
 */
async function calculateBabyStatistics(babyId: string, _birthDate: Date) {
  const now = new Date();
  const twentyFourHoursAgo = subDays(now, 1);

  // Get activities from the past 24 hours
  const recentActivities = await db
    .select()
    .from(Activities)
    .where(
      and(
        eq(Activities.babyId, babyId),
        gte(Activities.startTime, twentyFourHoursAgo),
      ),
    );

  // Count feeding activities
  const feedingCount = recentActivities.filter(
    (a) =>
      a.details?.type === 'nursing' ||
      a.details?.type === 'pumping' ||
      a.details?.type === 'solids',
  ).length;

  // Count diaper changes
  const diaperCount = recentActivities.filter(
    (a) =>
      a.details?.type === 'diaper' ||
      a.details?.type === 'wet' ||
      a.details?.type === 'dirty' ||
      a.details?.type === 'both',
  ).length;

  // Calculate sleep hours from sleep activities
  const sleepActivities = recentActivities.filter(
    (a) => a.details?.type === 'sleep',
  );
  const sleepHours = sleepActivities.reduce((total, activity) => {
    if (activity.duration) {
      return total + activity.duration / 60; // Convert minutes to hours
    }
    return total;
  }, 0);

  return {
    diaperCount,
    feedingCount,
    sleepHours: Math.round(sleepHours * 10) / 10, // Round to 1 decimal
  };
}

/**
 * Get celebration content based on baby's age and rules
 * This is the main function used by the tRPC router
 */
export async function getCelebrationContent(
  babyId: string,
  userId: string,
  baby: typeof Babies.$inferSelect,
): Promise<CelebrationCarouselData> {
  try {
    if (!baby || !baby.birthDate) {
      return { ageInDays: 0, baby: null, babyName: '', celebration: null };
    }

    const babyName = baby.firstName || 'Baby';
    const ageInDays = differenceInDays(new Date(), new Date(baby.birthDate));

    // Build rule context
    const context: RuleContext = {
      baby: {
        ageInDays,
        firstName: baby.firstName,
        lastName: baby.lastName,
        middleName: baby.middleName,
        sex: baby.gender || undefined,
      },
      ppDay: ageInDays,
      scope: Scope.Postpartum,
    };

    // Create celebrations program
    const program = createCelebrationsProgram();
    const builtProgram: Rule[] = program.build();

    // Find matching celebration rule for today
    const matchingRules = builtProgram.filter((rule) => {
      // Check screen and slot match
      if (rule.screen !== Screen.ParentDashboard || rule.slot !== Slot.Header) {
        return false;
      }

      // Evaluate all conditions
      return rule.conditions.every((condition) => evalCond(condition, context));
    });

    if (matchingRules.length === 0) {
      // No celebration today - check for upcoming celebration
      const nextCelebration = findNextCelebration(ageInDays);

      if (nextCelebration) {
        const shouldShow = shouldShowComingSoon(ageInDays, nextCelebration.day);

        return {
          ageInDays,
          baby,
          babyName,
          celebration: null,
          nextCelebration: {
            day: nextCelebration.day,
            shouldShow,
            title: nextCelebration.title,
          },
        };
      }

      return {
        ageInDays,
        baby,
        babyName,
        celebration: null,
      };
    }

    // Get the highest priority rule
    const rule = matchingRules.sort((a, b) => b.priority - a.priority)[0];

    if (!rule) {
      return {
        ageInDays,
        baby,
        babyName,
        celebration: null,
      };
    }

    // Type narrow to ensure we have a Card.Celebration rule
    if (rule.render.template !== 'Card.Celebration') {
      return {
        ageInDays,
        baby,
        babyName,
        celebration: null,
      };
    }

    // Now TypeScript knows rule.render.props is CardCelebrationProps
    const props = rule.render.props;

    // Calculate statistics
    const stats = await calculateBabyStatistics(babyId, baby.birthDate);

    // Extract celebrationType value
    let celebrationType: CelebrationType;
    if (typeof props.celebrationType === 'string') {
      celebrationType = props.celebrationType as CelebrationType;
    } else if (
      props.celebrationType &&
      typeof props.celebrationType === 'object' &&
      '_type' in props.celebrationType
    ) {
      return {
        ageInDays,
        baby,
        babyName,
        celebration: null,
      };
    } else {
      celebrationType = props.celebrationType as CelebrationType;
    }

    // Check if there's already a memory saved for this celebration
    const existingMemory = await db
      .select()
      .from(CelebrationMemories)
      .where(
        and(
          eq(CelebrationMemories.babyId, babyId),
          eq(CelebrationMemories.celebrationType, celebrationType),
        ),
      )
      .limit(1);

    let memory = existingMemory[0];

    // If no memory exists, create one automatically
    if (!memory) {
      try {
        const [newMemory] = await db
          .insert(CelebrationMemories)
          .values({
            babyId,
            celebrationDate: new Date(),
            celebrationType: celebrationType as CelebrationType,
            familyId: baby.familyId,
            id: createId({ prefix: 'celebration' }),
            userId,
          })
          .returning();
        if (newMemory) {
          memory = newMemory;
        }
      } catch (insertError) {
        console.error('Error creating celebration memory:', insertError);
        const retryMemory = await db
          .select()
          .from(CelebrationMemories)
          .where(
            and(
              eq(CelebrationMemories.babyId, babyId),
              eq(CelebrationMemories.celebrationType, celebrationType),
            ),
          )
          .limit(1);
        memory = retryMemory[0];
      }
    }

    if (!memory) {
      console.error('Failed to create or fetch celebration memory');
      return {
        ageInDays,
        baby,
        babyName,
        celebration: null,
      };
    }

    const validMemory = memory;

    // Check if we have cached AI content
    const hasAICache =
      validMemory.aiSummary &&
      validMemory.aiQuestions &&
      validMemory.aiGeneratedAt &&
      differenceInDays(new Date(), validMemory.aiGeneratedAt) < 1;

    // Build celebration card data
    const celebrationCard: CelebrationCardData = {
      actions: props.actions as Array<{
        type: 'save_memory' | 'take_photo' | 'share';
        label: string;
      }>,
      ageLabel: props.ageLabel as string,
      aiQuestions: hasAICache
        ? (validMemory.aiQuestions as {
            milestone: { question: string; systemPrompt: string };
            memory: { question: string; systemPrompt: string };
            guidance: { question: string; systemPrompt: string };
          })
        : undefined,
      aiSummary: hasAICache ? (validMemory.aiSummary ?? undefined) : undefined,
      celebrationType: props.celebrationType as string,
      id: validMemory.id,
      memory: {
        id: validMemory.id,
        note: validMemory.note,
        photoUrls: (validMemory.photoUrls as string[]) || [],
        sharedWith: (validMemory.sharedWith as string[]) || [],
      },
      showPhotoUpload: props.showPhotoUpload as boolean,
      statistics: {
        ageInDays: (props.statistics as { ageInDays: number }).ageInDays,
        ageLabel: (props.statistics as { ageLabel: string }).ageLabel,
        diaperCount: stats.diaperCount,
        feedingCount: stats.feedingCount,
        sleepHours: stats.sleepHours,
      },
      title: props.title as string,
      type: 'celebration',
    };

    return {
      ageInDays,
      aiContext: hasAICache
        ? undefined
        : {
            ageInDays,
            ageLabel: props.ageLabel as string,
            babyId,
            babyName,
            birthDate: baby.birthDate.toISOString(),
            celebrationMemoryId: validMemory.id,
            celebrationTitle: props.title as string,
            celebrationType: props.celebrationType as string,
            gender: baby.gender || undefined,
            statistics: {
              ageInDays,
              ageLabel: props.ageLabel as string,
              diaperCount: stats.diaperCount,
              feedingCount: stats.feedingCount,
              sleepHours: stats.sleepHours,
            },
          },
      baby,
      babyName,
      celebration: celebrationCard,
    };
  } catch (error) {
    console.error('Error fetching celebration content:', error);
    return {
      ageInDays: 0,
      baby: null,
      babyName: '',
      celebration: null,
    };
  }
}

/**
 * Get AI-enhanced celebration content
 * Checks cache first before generating to avoid expensive AI calls
 */
export async function getCelebrationAIContent(
  context: CelebrationEnhancementContext & { celebrationMemoryId: string },
) {
  try {
    // Check cache first - look for existing AI content in CelebrationMemories
    const existingMemory = await db
      .select()
      .from(CelebrationMemories)
      .where(eq(CelebrationMemories.id, context.celebrationMemoryId))
      .limit(1);

    const memory = existingMemory[0];

    if (memory) {
      // Check if we have valid cached AI content (less than 1 day old)
      const hasAICache =
        memory.aiSummary &&
        memory.aiQuestions &&
        memory.aiGeneratedAt &&
        differenceInDays(new Date(), memory.aiGeneratedAt) < 1;

      if (hasAICache) {
        console.log(
          '[Celebration Cache] Cache hit, returning cached AI content',
        );
        return {
          aiQuestions: memory.aiQuestions as {
            guidance: { question: string; systemPrompt: string };
            memory: { question: string; systemPrompt: string };
            milestone: { question: string; systemPrompt: string };
          },
          aiSummary: memory.aiSummary as string,
        };
      }
    }

    // Cache miss - generate new AI content
    console.log('[Celebration Cache] Cache miss, generating new AI content...');
    const startTime = Date.now();

    // Generate AI content
    const enhancement = await enhanceCelebration(context);

    const aiContent = {
      aiQuestions: {
        guidance: {
          question: enhancement.questions.guidance.question,
          systemPrompt: enhancement.questions.guidance.systemPrompt,
        },
        memory: {
          question: enhancement.questions.memory.question,
          systemPrompt: enhancement.questions.memory.systemPrompt,
        },
        milestone: {
          question: enhancement.questions.milestone.question,
          systemPrompt: enhancement.questions.milestone.systemPrompt,
        },
      },
      aiSummary: enhancement.summary.summary,
    };

    const endTime = Date.now();
    console.log(`[Celebration Cache] Generation took ${endTime - startTime}ms`);

    // Save AI content to database cache
    await db
      .update(CelebrationMemories)
      .set({
        aiGeneratedAt: new Date(),
        aiQuestions: aiContent.aiQuestions,
        aiSummary: aiContent.aiSummary,
      })
      .where(eq(CelebrationMemories.id, context.celebrationMemoryId));

    return aiContent;
  } catch (error) {
    console.error('Error fetching AI celebration content:', error);
    return {
      aiQuestions: undefined,
      aiSummary: undefined,
    };
  }
}
