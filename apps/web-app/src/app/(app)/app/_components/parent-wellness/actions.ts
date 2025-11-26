'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@nugget/db/client';
import { ParentDailyResponses } from '@nugget/db/schema';
import { eq } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

/**
 * Submit daily wellness response
 */
const submitResponseSchema = z.object({
  babyId: z.string(),
  responseId: z.string(),
  selectedAnswer: z.string(),
});

export const submitDailyWellnessResponseAction = action
  .schema(submitResponseSchema)
  .action(async ({ parsedInput }) => {
    const authResult = await auth();

    if (!authResult?.orgId || !authResult.userId) {
      throw new Error('Authentication required.');
    }

    const { orgId, userId } = authResult;

    // Verify the response belongs to the user
    const existingResponse = await db.query.ParentDailyResponses.findFirst({
      where: (responses, { and, eq }) =>
        and(
          eq(responses.id, parsedInput.responseId),
          eq(responses.userId, userId),
          eq(responses.babyId, parsedInput.babyId),
          eq(responses.familyId, orgId),
        ),
    });

    if (!existingResponse) {
      throw new Error('Response not found or unauthorized.');
    }

    // Verify the selected answer is one of the valid choices
    if (!existingResponse.answerChoices.includes(parsedInput.selectedAnswer)) {
      throw new Error('Invalid answer choice.');
    }

    // Update the response
    const [updatedResponse] = await db
      .update(ParentDailyResponses)
      .set({
        selectedAnswer: parsedInput.selectedAnswer,
        updatedAt: new Date(),
      })
      .where(eq(ParentDailyResponses.id, parsedInput.responseId))
      .returning();

    if (!updatedResponse) {
      throw new Error('Failed to update response.');
    }

    return {
      response: updatedResponse,
      success: true,
    };
  });
