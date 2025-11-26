import { DailyWellnessQuestion } from '@nugget/ai/react/server';
import { Babies, ParentDailyResponses } from '@nugget/db/schema';
import {
  differenceInDays,
  differenceInWeeks,
  startOfDay,
  subDays,
} from 'date-fns';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const parentWellnessRouter = createTRPCRouter({
  /**
   * Get or generate today's daily wellness question for the logged-in user
   */
  getDailyQuestion: protectedProcedure
    .input(z.object({ babyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.userId || !ctx.auth.orgId) {
        throw new Error('Unauthorized');
      }

      const today = startOfDay(new Date());

      // Check if we already have a question for today
      const existingResponse =
        await ctx.db.query.ParentDailyResponses.findFirst({
          where: (responses, { and, eq }) =>
            and(
              eq(responses.userId, ctx.auth.userId),
              eq(responses.date, today),
              eq(responses.babyId, input.babyId),
            ),
        });

      // If we have a question and it's already answered, return it
      if (existingResponse?.selectedAnswer) {
        return {
          answerChoices: existingResponse.answerChoices,
          id: existingResponse.id,
          isAnswered: true,
          question: existingResponse.question,
          selectedAnswer: existingResponse.selectedAnswer,
        };
      }

      // If we have a question but not answered, return it
      if (existingResponse) {
        return {
          answerChoices: existingResponse.answerChoices,
          id: existingResponse.id,
          isAnswered: false,
          question: existingResponse.question,
          selectedAnswer: null,
        };
      }

      // Generate new question using AI
      const baby = await ctx.db.query.Babies.findFirst({
        where: eq(Babies.id, input.babyId),
      });

      if (!baby || !baby.birthDate) {
        throw new Error('Baby not found');
      }

      const babyAgeInDays = differenceInDays(new Date(), baby.birthDate);
      const babyAgeInWeeks = differenceInWeeks(new Date(), baby.birthDate);

      // Get recent activity (last 24 hours)
      const oneDayAgo = subDays(new Date(), 1);
      const recentActivities = await ctx.db.query.Activities.findMany({
        where: (activities, { and, eq, gte }) =>
          and(
            eq(activities.babyId, input.babyId),
            ctx.auth.orgId
              ? eq(activities.familyId, ctx.auth.orgId)
              : undefined,
            gte(activities.startTime, oneDayAgo),
          ),
      });

      const feedingCount24h = recentActivities.filter(
        (a) =>
          a.type === 'feeding' || a.type === 'bottle' || a.type === 'nursing',
      ).length;

      const sleepActivities = recentActivities.filter(
        (a) => a.type === 'sleep',
      );
      const sleepHours24h =
        sleepActivities.length > 0
          ? sleepActivities.reduce((sum, a) => {
              const duration = a.duration ?? 0;
              return sum + duration / 60;
            }, 0)
          : null;

      const diaperCount24h = recentActivities.filter(
        (a) => a.type === 'diaper',
      ).length;

      // Get previous responses (last 14 days) for context
      const fourteenDaysAgo = subDays(new Date(), 14);
      const previousResponses =
        await ctx.db.query.ParentDailyResponses.findMany({
          limit: 14,
          orderBy: (responses, { desc }) => [desc(responses.date)],
          where: (responses, { and, eq, gte }) =>
            and(
              eq(responses.userId, ctx.auth.userId),
              eq(responses.babyId, input.babyId),
              gte(responses.date, fourteenDaysAgo),
            ),
        });

      const previousResponsesText =
        previousResponses.length > 0
          ? previousResponses
              .map(
                (r) =>
                  `${r.date.toISOString().split('T')[0]}: "${r.question}" - Answered: "${r.selectedAnswer ?? 'Not answered'}"`,
              )
              .join('\n')
          : null;

      // Calculate streak and weekly count
      const allResponses = await ctx.db.query.ParentDailyResponses.findMany({
        orderBy: (responses, { desc }) => [desc(responses.date)],
        where: (responses, { and, eq }) =>
          and(
            eq(responses.userId, ctx.auth.userId),
            eq(responses.babyId, input.babyId),
          ),
      });

      let currentStreak = 0;
      let daysSinceLastResponse: number | null = null;

      if (allResponses.length > 0 && allResponses[0]?.date) {
        const lastResponseDate = startOfDay(allResponses[0].date);
        const todayDate = startOfDay(new Date());
        const daysDiff = differenceInDays(todayDate, lastResponseDate);

        daysSinceLastResponse = daysDiff;

        // Calculate streak (consecutive days with responses)
        if (daysDiff === 0 || daysDiff === 1) {
          // Check consecutive days
          let streakDays = 0;
          let checkDate = startOfDay(new Date());

          for (let i = 0; i < 30; i++) {
            const responseForDay = allResponses.find((r) => {
              const rDate = startOfDay(r.date);
              return rDate.getTime() === checkDate.getTime();
            });

            if (responseForDay?.selectedAnswer) {
              streakDays++;
              checkDate = subDays(checkDate, 1);
            } else {
              break;
            }
          }

          currentStreak = streakDays;
        }
      }

      // Calculate weekly completion (current week, Mon-Sun)
      const weekStart = startOfDay(
        new Date(
          new Date().setDate(new Date().getDate() - new Date().getDay() + 1),
        ),
      );
      const weeklyResponses = allResponses.filter((r) => {
        const rDate = startOfDay(r.date);
        return rDate >= weekStart && r.selectedAnswer !== null;
      });
      const weeklyCompletionCount = weeklyResponses.length;

      // Generate question using AI
      try {
        const aiResult = await DailyWellnessQuestion(
          baby.firstName ?? 'Baby',
          babyAgeInDays,
          babyAgeInWeeks,
          feedingCount24h > 0 ? feedingCount24h : null,
          sleepHours24h,
          diaperCount24h > 0 ? diaperCount24h : null,
          previousResponsesText ?? null,
          currentStreak > 0 ? currentStreak : null,
          weeklyCompletionCount > 0 ? weeklyCompletionCount : null,
          daysSinceLastResponse,
        );

        // Save the generated question to the database
        const [savedResponse] = await ctx.db
          .insert(ParentDailyResponses)
          .values({
            answerChoices: aiResult.answerChoices,
            babyId: input.babyId,
            date: today,
            familyId: ctx.auth.orgId,
            question: aiResult.question,
            questionContext: {
              babyAgeInDays,
              babyAgeInWeeks,
              previousResponses: previousResponses.map((r) => ({
                date: r.date.toISOString(),
                question: r.question,
                selectedAnswer: r.selectedAnswer ?? '',
              })),
              recentActivitySummary: {
                diaperCount24h: diaperCount24h > 0 ? diaperCount24h : undefined,
                feedingCount24h:
                  feedingCount24h > 0 ? feedingCount24h : undefined,
                sleepHours24h: sleepHours24h ?? undefined,
              },
            },
            userId: ctx.auth.userId,
          })
          .returning();

        if (!savedResponse) {
          throw new Error('Failed to save question');
        }

        return {
          answerChoices: aiResult.answerChoices,
          id: savedResponse.id,
          isAnswered: false,
          question: aiResult.question,
          selectedAnswer: null,
        };
      } catch (error) {
        console.error('Failed to generate daily wellness question:', error);
        throw new Error('Failed to generate question. Please try again.');
      }
    }),

  /**
   * Get response history for stats and insights
   */
  getResponseHistory: protectedProcedure
    .input(
      z.object({
        babyId: z.string(),
        days: z.number().min(1).max(90).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.userId || !ctx.auth.orgId) {
        throw new Error('Unauthorized');
      }

      const cutoffDate = subDays(new Date(), input.days);

      const responses = await ctx.db.query.ParentDailyResponses.findMany({
        orderBy: (responses, { desc }) => [desc(responses.date)],
        where: (responses, { and, eq, gte }) =>
          and(
            eq(responses.userId, ctx.auth.userId),
            eq(responses.babyId, input.babyId),
            gte(responses.date, cutoffDate),
          ),
      });

      // Calculate streak
      let currentStreak = 0;
      if (responses.length > 0) {
        let checkDate = startOfDay(new Date());
        let consecutiveDays = 0;

        for (let i = 0; i < 30; i++) {
          const responseForDay = responses.find((r) => {
            const rDate = startOfDay(r.date);
            return rDate.getTime() === checkDate.getTime();
          });

          if (responseForDay?.selectedAnswer) {
            consecutiveDays++;
            checkDate = subDays(checkDate, 1);
          } else {
            break;
          }
        }

        currentStreak = consecutiveDays;
      }

      // Calculate weekly completion (current week)
      const weekStart = startOfDay(
        new Date(
          new Date().setDate(new Date().getDate() - new Date().getDay() + 1),
        ),
      );
      const weeklyResponses = responses.filter((r) => {
        const rDate = startOfDay(r.date);
        return rDate >= weekStart && r.selectedAnswer !== null;
      });
      const weeklyCompletionCount = weeklyResponses.length;

      return {
        currentStreak,
        responses: responses.map((r) => ({
          answerChoices: r.answerChoices,
          date: r.date,
          id: r.id,
          question: r.question,
          selectedAnswer: r.selectedAnswer,
        })),
        weeklyCompletionCount,
      };
    }),

  /**
   * Get AI-generated weekly insights from response patterns
   */
  getWeeklyInsights: protectedProcedure
    .input(z.object({ babyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.userId || !ctx.auth.orgId) {
        throw new Error('Unauthorized');
      }

      // Get last 30 days of responses
      const thirtyDaysAgo = subDays(new Date(), 30);
      const responses = await ctx.db.query.ParentDailyResponses.findMany({
        orderBy: (responses, { desc }) => [desc(responses.date)],
        where: (responses, { and, eq, gte }) =>
          and(
            eq(responses.userId, ctx.auth.userId),
            eq(responses.babyId, input.babyId),
            gte(responses.date, thirtyDaysAgo),
          ),
      });

      if (responses.length === 0) {
        return {
          insights:
            'Keep checking in daily to see personalized insights about your well-being patterns.',
        };
      }

      // Get baby context
      const baby = await ctx.db.query.Babies.findFirst({
        where: eq(Babies.id, input.babyId),
      });

      if (!baby) {
        throw new Error('Baby not found');
      }

      // TODO: Create a BAML function for insights generation
      // For now, return a simple message
      const answeredCount = responses.filter((r) => r.selectedAnswer).length;
      const totalDays = 30;

      const encouragementMessage =
        answeredCount >= 20
          ? "Great job maintaining consistency! You're building a healthy habit of self-reflection."
          : answeredCount >= 10
            ? "You're making progress! Try to check in daily to better understand your patterns."
            : "Keep going! Daily check-ins help you notice patterns in how you're feeling.";

      return {
        insights: `You've checked in ${answeredCount} out of the last ${totalDays} days. ${encouragementMessage}`,
      };
    }),

  /**
   * Submit a response to a daily wellness question
   */
  submitResponse: protectedProcedure
    .input(
      z.object({
        babyId: z.string(),
        responseId: z.string(),
        selectedAnswer: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.userId || !ctx.auth.orgId) {
        throw new Error('Unauthorized');
      }

      const userId = ctx.auth.userId;
      const orgId = ctx.auth.orgId;

      // Verify the response belongs to the user
      const existingResponse =
        await ctx.db.query.ParentDailyResponses.findFirst({
          where: (responses, { and, eq }) =>
            and(
              eq(responses.id, input.responseId),
              eq(responses.userId, userId),
              eq(responses.babyId, input.babyId),
              eq(responses.familyId, orgId),
            ),
        });

      if (!existingResponse) {
        throw new Error('Response not found or unauthorized.');
      }

      // Verify the selected answer is one of the valid choices
      if (!existingResponse.answerChoices.includes(input.selectedAnswer)) {
        throw new Error('Invalid answer choice.');
      }

      // Update the response
      const [updatedResponse] = await ctx.db
        .update(ParentDailyResponses)
        .set({
          selectedAnswer: input.selectedAnswer,
          updatedAt: new Date(),
        })
        .where(eq(ParentDailyResponses.id, input.responseId))
        .returning();

      if (!updatedResponse) {
        throw new Error('Failed to update response.');
      }

      return {
        response: updatedResponse,
        success: true,
      };
    }),
});
