import {
  Babies,
  ChatMessages,
  Chats,
  MilestoneQuestionResponses,
  Users,
} from '@nugget/db/schema';
import { and, asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const chatsRouter = createTRPCRouter({
  /**
   * Get a specific chat by ID with all messages
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Authentication required');
      }

      const chat = await ctx.db.query.Chats.findFirst({
        where: eq(Chats.id, input.id),
        with: {
          messages: {
            orderBy: asc(ChatMessages.createdAt),
          },
        },
      });

      if (!chat) {
        throw new Error('Chat not found');
      }

      return chat;
    }),

  /**
   * Get all users who have replied to a specific context (milestone/learning tip)
   * Used to show who has answered yes/no or sent messages in the context
   */
  getContextRepliers: protectedProcedure
    .input(
      z.object({
        babyId: z.string(),
        contextId: z.string(),
        contextType: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.userId) {
        throw new Error('Authentication required');
      }

      const currentUserId = ctx.auth.userId;

      // Get baby to retrieve familyId
      const baby = await ctx.db.query.Babies.findFirst({
        where: eq(Babies.id, input.babyId),
      });

      if (!baby) {
        throw new Error('Baby not found');
      }

      // Query milestone question responses for this context
      const responses = await ctx.db.query.MilestoneQuestionResponses.findMany({
        where: and(
          eq(MilestoneQuestionResponses.babyId, input.babyId),
          eq(MilestoneQuestionResponses.contextType, input.contextType),
          eq(MilestoneQuestionResponses.contextId, input.contextId),
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
        const user = await ctx.db.query.Users.findFirst({
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
      const allRepliers = [...yesRepliers, ...noRepliers];
      const chatMessageRepliers = [];

      const chatsForContext = await ctx.db.query.Chats.findMany({
        where: and(
          eq(Chats.babyId, input.babyId),
          eq(Chats.contextType, input.contextType),
          eq(Chats.contextId, input.contextId),
        ),
      });

      // Get unique user IDs from chat messages in these chats
      for (const chat of chatsForContext) {
        const messages = await ctx.db.query.ChatMessages.findMany({
          where: and(
            eq(ChatMessages.chatId, chat.id),
            eq(ChatMessages.role, 'user'), // Only user messages, not assistant
          ),
        });

        for (const message of messages) {
          if (!message.userId || seenUserIds.has(message.userId)) continue;

          seenUserIds.add(message.userId);

          // Get user information
          const user = await ctx.db.query.Users.findFirst({
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

            // Add to chat message repliers
            chatMessageRepliers.push(replier);
            allRepliers.push(replier);
          }
        }
      }

      // Check if current user has answered
      const hasCurrentUserAnswered =
        currentUserAnswer !== null || seenUserIds.has(currentUserId);

      return {
        allRepliers, // Combined list of all users who have interacted
        chatMessageRepliers, // Users who sent chat messages
        currentUserAnswer,
        hasCurrentUserAnswered,
        noRepliers,
        yesRepliers,
      };
    }),
  /**
   * List chats for a baby
   * Returns chats with their first message for timeline display
   */
  list: protectedProcedure
    .input(
      z.object({
        babyId: z.string(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Authentication required');
      }

      const { babyId, limit } = input;

      // Get all chats for this baby, ordered by most recent
      const chats = await ctx.db.query.Chats.findMany({
        limit,
        orderBy: desc(Chats.createdAt),
        where: eq(Chats.babyId, babyId),
      });

      // For each chat, get the first message
      const chatsWithFirstMessage = await Promise.all(
        chats.map(async (chat) => {
          const firstMessage = await ctx.db.query.ChatMessages.findFirst({
            orderBy: asc(ChatMessages.createdAt),
            where: eq(ChatMessages.chatId, chat.id),
          });

          if (firstMessage) {
            return {
              ...firstMessage,
              chat,
            };
          }
          return null;
        }),
      );

      // Filter out chats without messages and return
      return chatsWithFirstMessage.filter(
        (item): item is NonNullable<typeof item> => item !== null,
      );
    }),
});
