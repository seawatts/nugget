'use server';

import { auth } from '@clerk/nextjs/server';
import { b } from '@nugget/ai/async_client';
import { BabyAssistantChat as BabyAssistantChatStreaming } from '@nugget/ai/react/server_streaming';
import type {
  ChatMessage as BAMLChatMessage,
  BabyContext,
} from '@nugget/ai/types';
import { db } from '@nugget/db/client';
import {
  Activities,
  Babies,
  ChatMessages,
  Chats,
  MilestoneQuestionResponses,
  type NewChat,
  type NewChatMessage,
  Users,
} from '@nugget/db/schema';
import {
  differenceInDays,
  differenceInHours,
  differenceInWeeks,
  subDays,
} from 'date-fns';
import { and, desc, eq, gte } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { revalidateAppPaths } from '~/app/(app)/app/_utils/revalidation';

const action = createSafeActionClient();

// ============================================================================
// Helper Functions
// ============================================================================

async function getBabyContext(babyId: string): Promise<BabyContext> {
  // Get baby data
  const baby = await db.query.Babies.findFirst({
    where: eq(Babies.id, babyId),
  });

  if (!baby || !baby.birthDate) {
    throw new Error('Baby not found or missing birth date');
  }

  const ageInDays = differenceInDays(new Date(), baby.birthDate);
  const ageInWeeks = differenceInWeeks(new Date(), baby.birthDate);

  // Get recent activities (last 24h)
  const oneDayAgo = subDays(new Date(), 1);
  const recentActivities = await db
    .select()
    .from(Activities)
    .where(
      and(eq(Activities.babyId, babyId), gte(Activities.startTime, oneDayAgo)),
    )
    .execute();

  // Calculate activity stats
  const feedingCount = recentActivities.filter(
    (a) => a.type === 'feeding' || a.type === 'bottle' || a.type === 'nursing',
  ).length;

  const sleepActivities = recentActivities.filter((a) => a.type === 'sleep');
  const sleepCount = sleepActivities.length;
  const totalSleepHours =
    sleepActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / 60;

  const diaperCount = recentActivities.filter(
    (a) =>
      a.type === 'diaper' ||
      a.type === 'wet' ||
      a.type === 'dirty' ||
      a.type === 'both',
  ).length;

  // Calculate average feeding interval
  const feedingActivities = recentActivities
    .filter(
      (a) =>
        a.type === 'feeding' || a.type === 'bottle' || a.type === 'nursing',
    )
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  let avgFeedingInterval: number | undefined;
  if (feedingActivities.length > 1) {
    const intervals = [];
    for (let i = 1; i < feedingActivities.length; i++) {
      const currentStart = feedingActivities[i]?.startTime;
      const previousStart = feedingActivities[i - 1]?.startTime;
      if (!currentStart || !previousStart) continue;

      const hours = differenceInHours(currentStart, previousStart);
      intervals.push(hours);
    }
    avgFeedingInterval =
      intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  return {
    ageInDays,
    ageInWeeks,
    avgFeedingInterval,
    babyName: baby.firstName,
    birthWeightOz: baby.birthWeightOz ?? undefined,
    currentWeightOz: baby.currentWeightOz ?? undefined,
    diaperCount24h: diaperCount > 0 ? diaperCount : undefined,
    feedingCount24h: feedingCount > 0 ? feedingCount : undefined,
    sleepCount24h: sleepCount > 0 ? sleepCount : undefined,
    totalSleepHours24h: totalSleepHours > 0 ? totalSleepHours : undefined,
  };
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Create a new chat for a baby
 */
export const createNewChatAction = action
  .schema(
    z.object({
      babyId: z.string(),
      title: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    // Get baby to retrieve familyId
    const baby = await db.query.Babies.findFirst({
      where: eq(Babies.id, parsedInput.babyId),
    });

    if (!baby) throw new Error('Baby not found');

    const newChat: NewChat = {
      babyId: parsedInput.babyId,
      familyId: baby.familyId,
      title: parsedInput.title || 'New Chat',
      userId,
    };

    const [chat] = await db.insert(Chats).values(newChat).returning();

    return chat;
  });

/**
 * Find or create a chat for a specific context
 * This ensures we reuse existing chats for the same context (e.g., learning tip)
 */
export const findOrCreateContextChatAction = action
  .schema(
    z.object({
      babyId: z.string(),
      contextId: z.string(), // e.g., tip ID, milestone ID
      contextType: z.string(), // e.g., 'learning_tip', 'milestone', 'general'
      initialMessages: z
        .array(
          z.object({
            content: z.string(),
            role: z.enum(['user', 'assistant']),
          }),
        )
        .optional(),
      title: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    // Get baby to retrieve familyId
    const baby = await db.query.Babies.findFirst({
      where: eq(Babies.id, parsedInput.babyId),
    });

    if (!baby) throw new Error('Baby not found');

    // Try to find existing chat with this context
    const existingChat = await db.query.Chats.findFirst({
      where: and(
        eq(Chats.babyId, parsedInput.babyId),
        eq(Chats.contextType, parsedInput.contextType),
        eq(Chats.contextId, parsedInput.contextId),
        eq(Chats.userId, userId),
      ),
      with: {
        messages: {
          orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        },
      },
    });

    if (existingChat) {
      return {
        chat: existingChat,
        isNew: false,
        messages: existingChat.messages,
      };
    }

    // Create new chat if none exists
    const newChat: NewChat = {
      babyId: parsedInput.babyId,
      contextId: parsedInput.contextId,
      contextType: parsedInput.contextType,
      familyId: baby.familyId,
      title: parsedInput.title || 'New Chat',
      userId,
    };

    const [chat] = await db.insert(Chats).values(newChat).returning();

    if (!chat) {
      throw new Error('Failed to create chat');
    }

    // Save initial messages if provided
    const savedMessages = [];
    if (parsedInput.initialMessages && parsedInput.initialMessages.length > 0) {
      for (const msg of parsedInput.initialMessages) {
        const newMessage: NewChatMessage = {
          chatId: chat.id,
          content: msg.content,
          role: msg.role,
          userId,
        };

        const [savedMessage] = await db
          .insert(ChatMessages)
          .values(newMessage)
          .returning();
        savedMessages.push(savedMessage);
      }
    }

    // Revalidate the app page so chats appear in timeline
    revalidateAppPaths();

    return {
      chat,
      isNew: true,
      messages: savedMessages,
    };
  });

/**
 * Get all chats for a baby, ordered by most recent
 */
export const getChatHistoryAction = action
  .schema(
    z.object({
      babyId: z.string(),
      limit: z.number().optional().default(50),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const chats = await db
      .select()
      .from(Chats)
      .where(eq(Chats.babyId, parsedInput.babyId))
      .orderBy(desc(Chats.updatedAt))
      .limit(parsedInput.limit)
      .execute();

    return chats;
  });

/**
 * Get messages for a specific chat
 */
export const getChatMessagesAction = action
  .schema(
    z.object({
      chatId: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const messages = await db
      .select()
      .from(ChatMessages)
      .where(eq(ChatMessages.chatId, parsedInput.chatId))
      .orderBy(ChatMessages.createdAt)
      .execute();

    return messages;
  });

/**
 * Send a message in a chat and get AI response (non-streaming version)
 * If no chatId is provided, creates a new chat
 * @deprecated Use sendChatMessageStreamingAction for better UX
 */
export const sendChatMessageAction = action
  .schema(
    z.object({
      babyId: z.string(),
      chatId: z.string().optional(),
      contextId: z.string().optional(),
      contextType: z.string().optional(),
      message: z.string(),
      systemPrompt: z.string().optional(),
      title: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    // Get baby to retrieve familyId
    const baby = await db.query.Babies.findFirst({
      where: eq(Babies.id, parsedInput.babyId),
    });

    if (!baby) throw new Error('Baby not found');

    // If no chatId, create a new chat
    let chatId = parsedInput.chatId;
    if (!chatId) {
      const newChat: NewChat = {
        babyId: parsedInput.babyId,
        contextId: parsedInput.contextId || null,
        contextType: parsedInput.contextType || null,
        familyId: baby.familyId,
        title: parsedInput.title || 'New Chat',
        userId,
      };
      const [chat] = await db.insert(Chats).values(newChat).returning();
      chatId = chat?.id;
    }

    if (!chatId) {
      throw new Error('Chat ID is required');
    }

    // Save user message
    const userMessage: NewChatMessage = {
      chatId,
      content: parsedInput.message,
      role: 'user',
      userId,
    };
    const [savedUserMessage] = await db
      .insert(ChatMessages)
      .values(userMessage)
      .returning();

    // Get conversation history
    const previousMessages = await db
      .select()
      .from(ChatMessages)
      .where(eq(ChatMessages.chatId, chatId))
      .orderBy(ChatMessages.createdAt)
      .execute();

    // Build conversation history for BAML (excluding the message we just added)
    const conversationHistory: BAMLChatMessage[] = previousMessages
      .filter((m) => m.content !== parsedInput.message)
      .map((m) => ({
        content: m.content,
        role: m.role as 'user' | 'assistant',
      }));

    // Get baby context
    const babyContext = await getBabyContext(parsedInput.babyId);

    // Call BAML for AI response
    const aiResponse = await b.BabyAssistantChat(
      conversationHistory,
      babyContext,
      parsedInput.message,
      parsedInput.systemPrompt,
    );

    // Save assistant message
    const assistantMessage: NewChatMessage = {
      chatId,
      content: aiResponse.response,
      role: 'assistant',
      userId: null,
    };
    const [savedAssistantMessage] = await db
      .insert(ChatMessages)
      .values(assistantMessage)
      .returning();

    // Update chat's updatedAt timestamp
    await db
      .update(Chats)
      .set({ updatedAt: new Date() })
      .where(eq(Chats.id, chatId));

    // If this is the first exchange (2 messages total), generate a title
    if (previousMessages.length === 0) {
      // Don't await this - let it run in background
      void generateAndUpdateChatTitle(
        chatId,
        parsedInput.message,
        aiResponse.response,
      );
    }

    return {
      assistantMessage: savedAssistantMessage,
      chatId,
      userMessage: savedUserMessage,
    };
  });

/**
 * Send a message in a chat and stream AI response
 * If no chatId is provided, creates a new chat
 * This is the recommended action for better UX with streaming responses
 */
export async function sendChatMessageStreamingAction(input: {
  babyId: string;
  chatId?: string;
  message: string;
  systemPrompt?: string;
  contextType?: string; // e.g., 'learning_tip', 'milestone'
  contextId?: string; // e.g., tip ID, milestone ID
  title?: string; // Custom title for the chat
}): Promise<{
  stream: ReadableStream<Uint8Array>;
  chatId: string;
  userMessageId: string;
}> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Get baby to retrieve familyId
  const baby = await db.query.Babies.findFirst({
    where: eq(Babies.id, input.babyId),
  });

  if (!baby) throw new Error('Baby not found');

  // If no chatId, create a new chat
  let chatId = input.chatId;
  if (!chatId) {
    const newChat: NewChat = {
      babyId: input.babyId,
      contextId: input.contextId || null,
      contextType: input.contextType || null,
      familyId: baby.familyId,
      title: input.title || 'New Chat',
      userId,
    };
    const [chat] = await db.insert(Chats).values(newChat).returning();
    chatId = chat?.id;
  }

  if (!chatId) {
    throw new Error('Chat ID is required');
  }

  // Save user message
  const userMessage: NewChatMessage = {
    chatId,
    content: input.message,
    role: 'user',
    userId,
  };
  const [savedUserMessage] = await db
    .insert(ChatMessages)
    .values(userMessage)
    .returning();

  if (!savedUserMessage) {
    throw new Error('Failed to save user message');
  }

  // Get conversation history
  const previousMessages = await db
    .select()
    .from(ChatMessages)
    .where(eq(ChatMessages.chatId, chatId))
    .orderBy(ChatMessages.createdAt)
    .execute();

  // Build conversation history for BAML (excluding the message we just added)
  const conversationHistory: BAMLChatMessage[] = previousMessages
    .filter((m) => m.id !== savedUserMessage.id)
    .map((m) => ({
      content: m.content,
      role: m.role as 'user' | 'assistant',
    }));

  // Get baby context
  const babyContext = await getBabyContext(input.babyId);

  // Get the streaming response
  const stream = await BabyAssistantChatStreaming(
    conversationHistory,
    babyContext,
    input.message,
    input.systemPrompt,
  );

  // Create a transformed stream that saves the complete message
  const transformedStream = new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let _assistantMessageId: string | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode and parse the chunk
          const chunk = decoder.decode(value, { stream: true });
          try {
            const parsed = JSON.parse(chunk);

            // Accumulate the partial response
            if (parsed.partial?.response) {
              fullResponse = parsed.partial.response;
            }

            // When we get the final response, save it to the database
            if (parsed.final?.response) {
              fullResponse = parsed.final.response;

              const assistantMessage: NewChatMessage = {
                chatId,
                content: fullResponse,
                role: 'assistant',
                userId: null,
              };
              const [savedAssistantMessage] = await db
                .insert(ChatMessages)
                .values(assistantMessage)
                .returning();

              if (!savedAssistantMessage) {
                throw new Error('Failed to save assistant message');
              }

              _assistantMessageId = savedAssistantMessage.id;

              // Update chat's updatedAt timestamp
              await db
                .update(Chats)
                .set({ updatedAt: new Date() })
                .where(eq(Chats.id, chatId));

              // Revalidate the app page so chats appear in timeline
              revalidateAppPaths();

              // If this is the first exchange, generate a title
              if (previousMessages.length === 0) {
                void generateAndUpdateChatTitle(
                  chatId,
                  input.message,
                  fullResponse,
                );
              }
            }
          } catch (e) {
            // If chunk is not valid JSON, it might be incomplete - skip it
            console.error('Error parsing chunk:', e);
          }

          // Forward the chunk to the client
          controller.enqueue(value);
        }

        controller.close();
      } catch (error) {
        console.error('Error in streaming:', error);
        controller.error(error);
      }
    },
  });

  return {
    chatId,
    stream: transformedStream,
    userMessageId: savedUserMessage.id,
  };
}

/**
 * Get chat reply information for a specific context
 * Returns user information split by yes/no answers for yes/no questions
 * Also includes whether the current user has answered and their answer
 * For non-yes/no questions, returns all users who have sent messages in the context
 */
export const getContextChatReplyAction = action
  .schema(
    z.object({
      babyId: z.string(),
      contextId: z.string(),
      contextType: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) throw new Error('Unauthorized');

    // Get baby to retrieve familyId
    const baby = await db.query.Babies.findFirst({
      where: eq(Babies.id, parsedInput.babyId),
    });

    if (!baby) throw new Error('Baby not found');

    // Query milestone question responses for this context
    const responses = await db.query.MilestoneQuestionResponses.findMany({
      where: and(
        eq(MilestoneQuestionResponses.babyId, parsedInput.babyId),
        eq(MilestoneQuestionResponses.contextType, parsedInput.contextType),
        eq(MilestoneQuestionResponses.contextId, parsedInput.contextId),
      ),
    });

    // Split repliers by yes/no answers
    const yesRepliers = [];
    const noRepliers = [];
    const seenUserIds = new Set<string>();
    let currentUserAnswer: 'yes' | 'no' | null = null;

    for (const response of responses) {
      // Check if this is the current user's response
      if (response.userId === currentUserId && currentUserAnswer === null) {
        currentUserAnswer = response.answer as 'yes' | 'no';
      }

      // Skip duplicate users (take most recent response)
      if (seenUserIds.has(response.userId)) continue;
      seenUserIds.add(response.userId);

      // Get user information
      const user = await db.query.Users.findFirst({
        columns: {
          avatarUrl: true,
          firstName: true,
          id: true,
          lastName: true,
        },
        where: eq(Users.id, response.userId),
      });

      if (user) {
        const replier = {
          avatarUrl: user.avatarUrl,
          firstName: user.firstName,
          lastName: user.lastName,
          userId: user.id,
        };

        if (response.answer === 'yes') {
          yesRepliers.push(replier);
        } else if (response.answer === 'no') {
          noRepliers.push(replier);
        }
      }
    }

    // Also check for users who have sent chat messages in this context
    // This includes users who clicked "Answer" button for non-yes/no questions
    const allRepliers = [...yesRepliers, ...noRepliers];
    const chatMessageRepliers = [];

    const chatsForContext = await db.query.Chats.findMany({
      where: and(
        eq(Chats.babyId, parsedInput.babyId),
        eq(Chats.contextType, parsedInput.contextType),
        eq(Chats.contextId, parsedInput.contextId),
      ),
    });

    // Get unique user IDs from chat messages in these chats
    for (const chat of chatsForContext) {
      const messages = await db.query.ChatMessages.findMany({
        where: and(
          eq(ChatMessages.chatId, chat.id),
          eq(ChatMessages.role, 'user'), // Only user messages, not assistant
        ),
      });

      for (const message of messages) {
        if (!message.userId || seenUserIds.has(message.userId)) continue;

        seenUserIds.add(message.userId);

        // Get user information
        const user = await db.query.Users.findFirst({
          columns: {
            avatarUrl: true,
            firstName: true,
            id: true,
            lastName: true,
          },
          where: eq(Users.id, message.userId),
        });

        if (user) {
          const replier = {
            avatarUrl: user.avatarUrl,
            firstName: user.firstName,
            lastName: user.lastName,
            userId: user.id,
          };

          // Add to chat message repliers (shown on "Answer" button)
          chatMessageRepliers.push(replier);
          allRepliers.push(replier);
        }
      }
    }

    // Check if current user has answered (either via yes/no or by sending a message)
    const hasCurrentUserAnswered =
      currentUserAnswer !== null || seenUserIds.has(currentUserId);

    return {
      allRepliers, // Combined list of all users who have interacted (yes/no + chat messages)
      currentUserAnswer,
      hasCurrentUserAnswered,
      noRepliers,
      yesRepliers,
    };
  });

/**
 * Generate a chat title based on the first exchange
 */
async function generateAndUpdateChatTitle(
  chatId: string,
  firstUserMessage: string,
  firstAssistantResponse: string,
) {
  try {
    const titleResult = await b.GenerateChatTitle(
      firstUserMessage,
      firstAssistantResponse,
    );

    await db
      .update(Chats)
      .set({ title: titleResult.title })
      .where(eq(Chats.id, chatId));
  } catch (error) {
    console.error('Error generating chat title:', error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Update a chat's title manually
 */
export const updateChatTitleAction = action
  .schema(
    z.object({
      chatId: z.string(),
      title: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    const [chat] = await db
      .update(Chats)
      .set({ title: parsedInput.title })
      .where(eq(Chats.id, parsedInput.chatId))
      .returning();

    return chat;
  });

/**
 * Delete a chat and all its messages
 */
export const deleteChatAction = action
  .schema(
    z.object({
      chatId: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    await db.delete(Chats).where(eq(Chats.id, parsedInput.chatId));

    return { success: true };
  });
