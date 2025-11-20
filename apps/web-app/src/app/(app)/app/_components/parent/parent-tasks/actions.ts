'use server';

import { auth } from '@clerk/nextjs/server';
import { PersonalizedTasks } from '@nugget/ai/react/server';
import { db } from '@nugget/db/client';
import { ParentTasks } from '@nugget/db/schema';
import { differenceInDays } from 'date-fns';
import { and, desc, eq } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

// ============================================================================
// Types
// ============================================================================

export interface ParentTask {
  id?: string;
  taskText: string;
  category:
    | 'baby_care'
    | 'household'
    | 'self_care'
    | 'relationship'
    | 'preparation';
  priority: 'high' | 'medium' | 'low';
  suggestedTime: string;
  estimatedMinutes: number;
  whyItMatters: string;
  completed: boolean;
  completedAt?: Date;
}

export interface TasksOutput {
  tasks: ParentTask[];
  motivationalMessage: string;
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Get personalized tasks for a parent
 */
export const getPersonalizedTasksAction = action
  .schema(
    z.object({
      timeOfDay: z
        .enum(['morning', 'afternoon', 'evening', 'anytime'])
        .default('anytime'),
      userId: z.string(),
    }),
  )
  .action(async ({ parsedInput }): Promise<TasksOutput> => {
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
        motivationalMessage:
          'Welcome! Start tracking your baby to get personalized tasks.',
        tasks: [],
      };
    }

    const babyAgeInDays = differenceInDays(new Date(), baby.birthDate);
    const ppWeek = Math.floor(babyAgeInDays / 7);

    // Determine feeding method based on recent activities (simplified)
    const feedingMethod = 'mixed'; // TODO: Detect from activities

    // Call BAML function
    const bamlResult = await PersonalizedTasks(
      babyAgeInDays,
      ppWeek,
      parsedInput.timeOfDay,
      feedingMethod,
    );

    // Save tasks to database
    const savedTasks = await Promise.all(
      bamlResult.tasks.map(async (task) => {
        const savedTaskArray = await db
          .insert(ParentTasks)
          .values({
            category: task.category as ParentTask['category'],
            completed: false,
            context: {
              babyAgeInDays,
              feedingMethod,
              ppWeek,
              timeOfDay: parsedInput.timeOfDay,
            },
            estimatedMinutes: task.estimatedMinutes,
            familyId: orgId,
            generatedDate: new Date(),
            priority: task.priority as ParentTask['priority'],
            suggestedTime: task.suggestedTime,
            taskText: task.taskText,
            userId: parsedInput.userId,
            whyItMatters: task.whyItMatters,
          })
          .returning();

        if (!savedTaskArray || savedTaskArray.length === 0) {
          throw new Error('Failed to save task');
        }
        return savedTaskArray[0];
      }),
    );

    return {
      motivationalMessage: bamlResult.motivationalMessage,
      tasks: savedTasks
        .filter((t): t is NonNullable<typeof t> => t !== undefined)
        .map((t) => ({
          category: t.category as ParentTask['category'],
          completed: t.completed,
          completedAt: t.completedAt ?? undefined,
          estimatedMinutes: t.estimatedMinutes ?? 15,
          id: t.id,
          priority: t.priority as ParentTask['priority'],
          suggestedTime: t.suggestedTime ?? 'anytime',
          taskText: t.taskText,
          whyItMatters: t.whyItMatters ?? '',
        })),
    };
  });

/**
 * Get existing tasks for today
 */
export const getTodaysTasksAction = action
  .schema(z.object({ userId: z.string() }))
  .action(async ({ parsedInput }): Promise<ParentTask[]> => {
    const authResult = await auth();

    if (!authResult?.orgId) {
      throw new Error('Authentication required.');
    }

    const { orgId } = authResult;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await db.query.ParentTasks.findMany({
      limit: 20,
      orderBy: [desc(ParentTasks.priority), desc(ParentTasks.generatedDate)],
      where: and(
        eq(ParentTasks.familyId, orgId),
        eq(ParentTasks.userId, parsedInput.userId),
        // Get tasks generated today or incomplete tasks from previous days
      ),
    });

    return tasks.map((t) => ({
      category: t.category as ParentTask['category'],
      completed: t.completed,
      completedAt: t.completedAt ?? undefined,
      estimatedMinutes: t.estimatedMinutes ?? 15,
      id: t.id,
      priority: t.priority as ParentTask['priority'],
      suggestedTime: t.suggestedTime ?? 'anytime',
      taskText: t.taskText,
      whyItMatters: t.whyItMatters ?? '',
    }));
  });

/**
 * Complete a task
 */
export const completeTaskAction = action
  .schema(z.object({ taskId: z.string() }))
  .action(async ({ parsedInput }) => {
    const authResult = await auth();

    if (!authResult?.userId || !authResult?.orgId) {
      throw new Error('Authentication required.');
    }

    const { userId, orgId: _orgId } = authResult;

    await db
      .update(ParentTasks)
      .set({
        completed: true,
        completedAt: new Date(),
      })
      .where(
        and(
          eq(ParentTasks.id, parsedInput.taskId),
          eq(ParentTasks.userId, userId),
        ),
      );

    return { success: true };
  });

/**
 * Uncomplete a task
 */
export const uncompleteTaskAction = action
  .schema(z.object({ taskId: z.string() }))
  .action(async ({ parsedInput }) => {
    const authResult = await auth();

    if (!authResult?.userId || !authResult?.orgId) {
      throw new Error('Authentication required.');
    }

    const { userId, orgId: _orgId } = authResult;

    await db
      .update(ParentTasks)
      .set({
        completed: false,
        completedAt: null,
      })
      .where(
        and(
          eq(ParentTasks.id, parsedInput.taskId),
          eq(ParentTasks.userId, userId),
        ),
      );

    return { success: true };
  });

/**
 * Get task completion stats
 */
export const getTaskCompletionStatsAction = action
  .schema(z.object({ days: z.number().default(7), userId: z.string() }))
  .action(async ({ parsedInput }) => {
    const authResult = await auth();

    if (!authResult?.orgId) {
      throw new Error('Authentication required.');
    }

    const { orgId } = authResult;

    const since = new Date();
    since.setDate(since.getDate() - parsedInput.days);

    const tasks = await db.query.ParentTasks.findMany({
      where: and(
        eq(ParentTasks.familyId, orgId),
        eq(ParentTasks.userId, parsedInput.userId),
      ),
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      completedTasks,
      completionRate: Math.round(completionRate),
      totalTasks,
    };
  });
