'use server';

import { auth } from '@clerk/nextjs/server';
import { WellnessScreening } from '@nugget/ai/react/server';
import { db } from '@nugget/db/client';
import { ParentCheckIns, WellnessAssessments } from '@nugget/db/schema';
import { differenceInDays } from 'date-fns';
import { and, desc, eq } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

// ============================================================================
// Types
// ============================================================================

export interface WellnessQuestion {
  questionId: number;
  question: string;
  responseType: string;
  category: string;
  weight: number;
  reverseScore: boolean;
}

export interface WellnessScreeningOutput {
  questions: WellnessQuestion[];
  scoringGuidance: string;
  supportResources: string[];
  title: string;
  urgent?: boolean;
}

export interface WellnessTrend {
  date: Date;
  riskScore: number | null;
  assessmentType: string;
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Get wellness screening assessment questions
 */
export const getWellnessAssessmentAction = action
  .schema(
    z.object({ triggered: z.boolean().default(false), userId: z.string() }),
  )
  .action(async ({ parsedInput }): Promise<WellnessScreeningOutput> => {
    const authResult = await auth();

    if (!authResult?.orgId) {
      throw new Error('Authentication required.');
    }

    const { orgId } = authResult;

    // Get baby data
    const baby = await db.query.Babies.findFirst({
      orderBy: (babies, { desc }) => [desc(babies.birthDate)],
      where: (babies, { eq }) => eq(babies.familyId, orgId),
    });

    if (!baby || !baby.birthDate) {
      return {
        questions: [],
        scoringGuidance:
          'Complete your baby profile to get wellness assessments.',
        supportResources: [],
        title: 'Wellness Check',
      };
    }

    const ppDay = differenceInDays(new Date(), baby.birthDate);
    const ppWeek = Math.floor(ppDay / 7);
    const ageInDays = ppDay;

    // Get previous check-ins for context
    const checkIns = await db.query.ParentCheckIns.findMany({
      limit: 5,
      orderBy: [desc(ParentCheckIns.date)],
      where: and(
        eq(ParentCheckIns.userId, parsedInput.userId),
        eq(ParentCheckIns.familyId, orgId),
      ),
    });

    const previousCheckIns = checkIns.map((c) => ({
      concernsRaised: (c.concernsRaised as string[]) ?? [],
      date: c.date.toISOString(),
      moodScore: c.moodScore ?? 3,
    }));

    // Determine first pregnancy
    const allBabies = await db.query.Babies.findMany({
      where: (babies, { eq }) => eq(babies.familyId, orgId),
    });
    const firstPregnancy = allBabies.length === 1;

    // Call BAML function
    const bamlResult = await WellnessScreening(
      ppDay,
      ppWeek,
      firstPregnancy,
      baby.firstName,
      ageInDays,
      JSON.stringify(previousCheckIns),
    );

    return {
      questions: bamlResult.questions.map((q, idx) => ({
        category: q.category,
        question: q.question,
        questionId: idx + 1,
        responseType: q.responseType,
        reverseScore: q.reverseScore,
        weight: q.weight,
      })),
      scoringGuidance: bamlResult.scoringGuidance,
      supportResources: bamlResult.supportResources,
      title: parsedInput.triggered
        ? 'Follow-Up Wellness Check'
        : 'Wellness Assessment',
      urgent: parsedInput.triggered,
    };
  });

/**
 * Submit wellness assessment responses
 */
const submitWellnessSchema = z.object({
  assessmentType: z.string(),
  notes: z.string().optional(),
  questions: z.array(
    z.object({
      category: z.string(),
      question: z.string(),
      responseType: z.string(),
      reverseScore: z.boolean(),
      weight: z.number(),
    }),
  ),
  responses: z.array(
    z.object({
      questionId: z.number(),
      response: z.union([z.number(), z.string()]),
    }),
  ),
  userId: z.string(),
});

export const submitWellnessResponsesAction = action
  .schema(submitWellnessSchema)
  .action(async ({ parsedInput }) => {
    const authResult = await auth();

    if (!authResult?.orgId) {
      throw new Error('Authentication required.');
    }

    const { orgId } = authResult;

    // Calculate risk score
    let riskScore = 0;
    for (const response of parsedInput.responses) {
      const question = parsedInput.questions[response.questionId - 1];
      if (question && typeof response.response === 'number') {
        const score = question.reverseScore
          ? question.weight - response.response
          : response.response;
        riskScore += score;
      }
    }

    // Generate recommendations based on score
    const recommendations: string[] = [];
    if (riskScore >= 13) {
      recommendations.push(
        'Your score suggests you may be experiencing symptoms of postpartum depression. Please reach out to your healthcare provider.',
      );
      recommendations.push(
        'National Maternal Mental Health Hotline: 1-833-TLC-MAMA (1-833-852-6262)',
      );
      recommendations.push('Postpartum Support International: 1-800-944-4773');
    } else if (riskScore >= 10) {
      recommendations.push(
        'Your score suggests mild symptoms. Consider talking to your doctor or a mental health professional.',
      );
      recommendations.push(
        'Practice self-care and reach out to your support network.',
      );
    } else {
      recommendations.push(
        'Your score suggests minimal symptoms. Continue to monitor your well-being.',
      );
      recommendations.push(
        'Regular check-ins can help identify changes early.',
      );
    }

    // Save assessment
    const [assessment] = await db
      .insert(WellnessAssessments)
      .values({
        assessmentType: parsedInput.assessmentType,
        date: new Date(),
        familyId: orgId,
        followUpScheduled:
          riskScore >= 13
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            : null,
        notes: parsedInput.notes ?? null,
        questions: parsedInput.questions,
        recommendations,
        responses: parsedInput.responses,
        riskScore,
        userId: parsedInput.userId,
      })
      .returning();

    if (!assessment) {
      throw new Error('Failed to save assessment.');
    }

    return { assessment: { ...assessment, riskScore }, success: true };
  });

/**
 * Get wellness trends
 */
export const getWellnessTrendsAction = action
  .schema(z.object({ days: z.number().default(90), userId: z.string() }))
  .action(async ({ parsedInput }): Promise<WellnessTrend[]> => {
    const authResult = await auth();

    if (!authResult?.orgId) {
      throw new Error('Authentication required.');
    }

    const { orgId } = authResult;

    const since = new Date();
    since.setDate(since.getDate() - parsedInput.days);

    const assessments = await db.query.WellnessAssessments.findMany({
      orderBy: [desc(WellnessAssessments.date)],
      where: and(
        eq(WellnessAssessments.familyId, orgId),
        eq(WellnessAssessments.userId, parsedInput.userId),
      ),
    });

    return assessments.map((a) => ({
      assessmentType: a.assessmentType,
      date: a.date,
      riskScore: a.riskScore,
    }));
  });
