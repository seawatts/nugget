'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
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
  CelebrationMemories,
  type celebrationTypeEnum,
} from '@nugget/db/schema';

// Type for celebration type values
type CelebrationType = (typeof celebrationTypeEnum.enumValues)[number];

import type { CelebrationEnhancementContext } from '@nugget/ai/celebration-orchestrator';
import { enhanceCelebration } from '@nugget/ai/celebration-orchestrator';
import { createId } from '@nugget/id';
import { differenceInDays, subDays } from 'date-fns';
import { and, eq, gte } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

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

interface CelebrationCarouselData {
  celebration: CelebrationCardData | null;
  babyName: string;
  ageInDays: number;
  baby: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string | null;
    birthDate: Date | null;
    dueDate: Date | null;
    journeyStage: string | null;
    gender: string | null;
  } | null;
  aiContext?: CelebrationEnhancementContext & { celebrationMemoryId: string };
}

/**
 * Calculate baby activity statistics for the past 24 hours and past week
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
 * Fetch celebration content based on baby's age
 */
export async function getCelebrationContent(
  babyId: string,
): Promise<CelebrationCarouselData> {
  try {
    // Verify authentication
    const authResult = await auth();
    if (!authResult.userId) {
      return { ageInDays: 0, baby: null, babyName: '', celebration: null };
    }

    // Get the specific baby by ID
    const api = await getApi();
    const baby = await api.babies.getById({ id: babyId });

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

    // Extract celebrationType value (handle PropValue wrapper)
    let celebrationType: CelebrationType;
    if (typeof props.celebrationType === 'string') {
      celebrationType = props.celebrationType as CelebrationType;
    } else if (
      props.celebrationType &&
      typeof props.celebrationType === 'object' &&
      '_type' in props.celebrationType
    ) {
      // Skip if it's a PropValue - we can't resolve it here
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
    // This allows us to cache AI content even if user hasn't manually saved anything
    if (!memory) {
      try {
        const [newMemory] = await db
          .insert(CelebrationMemories)
          .values({
            babyId,
            celebrationDate: new Date(),
            celebrationType: celebrationType as CelebrationType,
            familyId: baby.familyId, // Required field from baby record
            userId: authResult.userId,
          })
          .returning();
        if (newMemory) {
          memory = newMemory;
        }
      } catch (insertError) {
        // If insert fails (maybe due to constraint), try to fetch again
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

    // Safety check - if we still don't have a memory, something went wrong
    if (!memory) {
      console.error('Failed to create or fetch celebration memory');
      return {
        ageInDays,
        baby,
        babyName,
        celebration: null,
      };
    }

    // At this point, memory is guaranteed to exist
    const validMemory = memory;

    // Check if we have cached AI content in the database
    const hasAICache =
      validMemory.aiSummary &&
      validMemory.aiQuestions &&
      validMemory.aiGeneratedAt &&
      // Cache is valid for 24 hours
      differenceInDays(new Date(), validMemory.aiGeneratedAt) < 1;

    // Note: AI enhancement is done in the client component to show static content immediately
    // The card will display inline loading states for AI content

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
      // Include cached AI content if available
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

    // Return the context for AI enhancement along with the card data
    // Only include aiContext if we need to generate AI content
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
 * Fetch AI enhancement for a celebration card
 * This is called separately to show static content immediately
 * Results are cached in the database for 24 hours
 */
export async function getCelebrationAIContent(
  context: CelebrationEnhancementContext & { celebrationMemoryId: string },
) {
  try {
    const authResult = await auth();
    if (!authResult.userId) {
      throw new Error('Unauthorized');
    }

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
    // Return undefined to let the card show fallback UI
    return {
      aiQuestions: undefined,
      aiSummary: undefined,
    };
  }
}

/**
 * Save a celebration memory
 */
export const saveCelebrationMemoryAction = action
  .schema(
    z.object({
      babyId: z.string(),
      celebrationType: z.string(),
      note: z.string().optional(),
      photoUrls: z.array(z.string()).optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const authResult = await auth();
    if (!authResult.userId) {
      throw new Error('Unauthorized');
    }

    const { babyId, celebrationType, note, photoUrls } = parsedInput;

    // Check if memory already exists
    const existingMemory = await db
      .select()
      .from(CelebrationMemories)
      .where(
        and(
          eq(CelebrationMemories.babyId, babyId),
          eq(
            CelebrationMemories.celebrationType,
            celebrationType as CelebrationType,
          ),
        ),
      )
      .limit(1);

    if (existingMemory.length > 0 && existingMemory[0]) {
      // Update existing memory
      const existing = existingMemory[0];
      const updated = await db
        .update(CelebrationMemories)
        .set({
          note: note || existing.note,
          photoUrls: photoUrls || (existing.photoUrls as string[]),
          updatedAt: new Date(),
        })
        .where(eq(CelebrationMemories.id, existing.id))
        .returning();

      return {
        memory: updated[0],
        success: true,
      };
    }

    // Create new memory
    const newMemory = await db
      .insert(CelebrationMemories)
      .values({
        babyId,
        celebrationDate: new Date(),
        celebrationType: celebrationType as CelebrationType,
        id: createId({ prefix: 'celebration' }),
        note: note || null,
        photoUrls: photoUrls || [],
        sharedWith: [],
        userId: authResult.userId,
      })
      .returning();

    return {
      memory: newMemory[0],
      success: true,
    };
  });

/**
 * Add photo to celebration memory
 */
export const addCelebrationPhotoAction = action
  .schema(
    z.object({
      babyId: z.string(),
      celebrationType: z.string(),
      photoUrl: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const authResult = await auth();
    if (!authResult.userId) {
      throw new Error('Unauthorized');
    }

    const { babyId, celebrationType, photoUrl } = parsedInput;

    // Get or create memory
    const existingMemory = await db
      .select()
      .from(CelebrationMemories)
      .where(
        and(
          eq(CelebrationMemories.babyId, babyId),
          eq(
            CelebrationMemories.celebrationType,
            celebrationType as CelebrationType,
          ),
        ),
      )
      .limit(1);

    if (existingMemory.length > 0 && existingMemory[0]) {
      const existing = existingMemory[0];
      const currentPhotos = (existing.photoUrls as string[]) || [];
      const updated = await db
        .update(CelebrationMemories)
        .set({
          photoUrls: [...currentPhotos, photoUrl],
          updatedAt: new Date(),
        })
        .where(eq(CelebrationMemories.id, existing.id))
        .returning();

      return {
        memory: updated[0],
        success: true,
      };
    }

    // Create new memory with photo
    const newMemory = await db
      .insert(CelebrationMemories)
      .values({
        babyId,
        celebrationDate: new Date(),
        celebrationType: celebrationType as CelebrationType,
        id: createId({ prefix: 'celebration' }),
        photoUrls: [photoUrl],
        sharedWith: [],
        userId: authResult.userId,
      })
      .returning();

    return {
      memory: newMemory[0],
      success: true,
    };
  });

/**
 * Share celebration with family members
 */
export const shareCelebrationAction = action
  .schema(
    z.object({
      babyId: z.string(),
      celebrationType: z.string(),
      userIds: z.array(z.string()),
    }),
  )
  .action(async ({ parsedInput }) => {
    const authResult = await auth();
    if (!authResult.userId) {
      throw new Error('Unauthorized');
    }

    const { babyId, celebrationType, userIds } = parsedInput;

    // Get or create memory
    const existingMemory = await db
      .select()
      .from(CelebrationMemories)
      .where(
        and(
          eq(CelebrationMemories.babyId, babyId),
          eq(
            CelebrationMemories.celebrationType,
            celebrationType as CelebrationType,
          ),
        ),
      )
      .limit(1);

    if (existingMemory.length > 0 && existingMemory[0]) {
      const existing = existingMemory[0];
      const currentSharedWith = (existing.sharedWith as string[]) || [];
      const newSharedWith = Array.from(
        new Set([...currentSharedWith, ...userIds]),
      );

      const updated = await db
        .update(CelebrationMemories)
        .set({
          sharedWith: newSharedWith,
          updatedAt: new Date(),
        })
        .where(eq(CelebrationMemories.id, existing.id))
        .returning();

      return {
        memory: updated[0],
        sharedCount: userIds.length,
        success: true,
      };
    }

    // Create new memory with sharing
    const newMemory = await db
      .insert(CelebrationMemories)
      .values({
        babyId,
        celebrationDate: new Date(),
        celebrationType: celebrationType as CelebrationType,
        id: createId({ prefix: 'celebration' }),
        sharedWith: userIds,
        userId: authResult.userId,
      })
      .returning();

    return {
      memory: newMemory[0],
      sharedCount: userIds.length,
      success: true,
    };
  });
