'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import { db } from '@nugget/db/client';
import {
  insertMilestoneQuestionResponseSchema,
  MilestoneQuestionResponses,
  selectMilestoneQuestionResponseSchema,
} from '@nugget/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

/**
 * Save a yes/no answer to a milestone question
 */
export const saveMilestoneQuestionResponseAction = action
  .schema(
    insertMilestoneQuestionResponseSchema.extend({
      // Override to accept string literal instead of enum
      answer: z.enum(['yes', 'no']),
    }),
  )
  .action(async ({ parsedInput }) => {
    // Get auth and baby info for familyId
    const authResult = await auth();
    if (!authResult.userId) {
      throw new Error('Unauthorized');
    }

    const api = await getApi();
    const baby = await api.babies.getById({ id: parsedInput.babyId });

    if (!baby) {
      throw new Error('Baby not found');
    }

    const [response] = await db
      .insert(MilestoneQuestionResponses)
      .values({
        answer: parsedInput.answer,
        babyId: parsedInput.babyId,
        chatId: parsedInput.chatId || null,
        contextId: parsedInput.contextId,
        contextType: parsedInput.contextType,
        familyId: baby.familyId,
        question: parsedInput.question,
        userId: authResult.userId,
      })
      .onConflictDoUpdate({
        set: {
          answer: parsedInput.answer,
          chatId: parsedInput.chatId || null,
          updatedAt: new Date(),
        },
        target: [
          MilestoneQuestionResponses.userId,
          MilestoneQuestionResponses.contextType,
          MilestoneQuestionResponses.contextId,
          MilestoneQuestionResponses.question,
        ],
      })
      .returning();

    return {
      response: selectMilestoneQuestionResponseSchema.parse(response),
      success: true,
    };
  });

/**
 * Get previous answer for a specific milestone question
 */
export const getMilestoneQuestionResponseAction = action
  .schema(
    z.object({
      babyId: z.string(),
      contextId: z.string(),
      contextType: z.string(),
      question: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const response = await db.query.MilestoneQuestionResponses.findFirst({
      orderBy: [desc(MilestoneQuestionResponses.createdAt)],
      where: and(
        eq(MilestoneQuestionResponses.babyId, parsedInput.babyId),
        eq(MilestoneQuestionResponses.contextType, parsedInput.contextType),
        eq(MilestoneQuestionResponses.contextId, parsedInput.contextId),
        eq(MilestoneQuestionResponses.question, parsedInput.question),
      ),
    });

    return response
      ? selectMilestoneQuestionResponseSchema.parse(response)
      : null;
  });

/**
 * Get all responses for a specific context (e.g., all responses for a milestone)
 */
export const getMilestoneContextResponsesAction = action
  .schema(
    z.object({
      babyId: z.string(),
      contextId: z.string(),
      contextType: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const responses = await db.query.MilestoneQuestionResponses.findMany({
      orderBy: [desc(MilestoneQuestionResponses.createdAt)],
      where: and(
        eq(MilestoneQuestionResponses.babyId, parsedInput.babyId),
        eq(MilestoneQuestionResponses.contextType, parsedInput.contextType),
        eq(MilestoneQuestionResponses.contextId, parsedInput.contextId),
      ),
    });

    return responses.map((r) => selectMilestoneQuestionResponseSchema.parse(r));
  });
