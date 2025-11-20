import { ChatMessages, Chats } from '@nugget/db/schema';
import { asc, desc, eq } from 'drizzle-orm';
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
