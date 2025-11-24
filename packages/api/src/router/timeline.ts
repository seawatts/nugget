import {
  Activities,
  Babies,
  ChatMessages,
  Chats,
  Milestones,
} from '@nugget/db/schema';
import { and, asc, desc, eq, inArray, isNotNull, lt } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

// Discriminated union types for timeline items
export type TimelineActivity = {
  type: 'activity';
  data: typeof Activities.$inferSelect & {
    user?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
      email: string;
    } | null;
  };
  timestamp: Date;
};

export type TimelineMilestone = {
  type: 'milestone';
  data: typeof Milestones.$inferSelect;
  timestamp: Date;
};

export type TimelineChatMessage = {
  type: 'chat';
  data: typeof ChatMessages.$inferSelect & {
    chat: typeof Chats.$inferSelect;
  };
  timestamp: Date;
};

export type TimelineItem =
  | TimelineActivity
  | TimelineMilestone
  | TimelineChatMessage;

export const timelineRouter = createTRPCRouter({
  /**
   * Fetch paginated timeline items (activities, milestones, chats)
   * Uses cursor-based pagination for infinite scroll
   */
  getItems: protectedProcedure
    .input(
      z.object({
        activityTypes: z.array(z.string()).optional(),
        babyId: z.string(),
        cursor: z.string().optional(), // ISO timestamp of the oldest item from the previous page
        itemTypes: z
          .array(z.enum(['activity', 'milestone', 'chat']))
          .optional(),
        limit: z.number().min(1).max(100).default(30),
        userIds: z.array(z.string()).optional(),
      }),
    )
    .query(
      async ({
        ctx,
        input,
      }): Promise<{
        items: TimelineItem[];
        nextCursor: string | null;
      }> => {
        if (!ctx.auth.userId || !ctx.auth.orgId) {
          throw new Error('Authentication required');
        }

        const { babyId, itemTypes, activityTypes, userIds, limit, cursor } =
          input;

        // Verify baby belongs to user's family
        const babyCheck = await ctx.db.query.Babies.findFirst({
          where: and(
            eq(Babies.id, babyId),
            eq(Babies.familyId, ctx.auth.orgId),
          ),
        });

        if (!babyCheck) {
          throw new Error('Baby not found or does not belong to your family');
        }

        // Parse cursor to get the cutoff timestamp for pagination
        const cursorDate = cursor ? new Date(cursor) : null;

        // Determine which types to fetch (default to all if not specified)
        const shouldFetchActivities =
          !itemTypes || itemTypes.includes('activity');
        const shouldFetchMilestones =
          !itemTypes || itemTypes.includes('milestone');
        const shouldFetchChats = !itemTypes || itemTypes.includes('chat');

        const allItems: TimelineItem[] = [];

        // Fetch more items than the limit to account for interleaving different types
        const fetchLimit = Math.min(limit * 3, 1000);

        // Fetch activities if needed
        if (shouldFetchActivities) {
          const activityConditions = [
            eq(Activities.babyId, babyId),
            eq(Activities.isScheduled, false),
          ];

          if (cursorDate) {
            activityConditions.push(lt(Activities.startTime, cursorDate));
          }

          if (activityTypes && activityTypes.length > 0) {
            activityConditions.push(
              // biome-ignore lint/suspicious/noExplicitAny: drizzle type inference limitation with enum columns
              inArray(Activities.type, activityTypes as any),
            );
          }

          if (userIds && userIds.length > 0) {
            activityConditions.push(inArray(Activities.userId, userIds));
          }

          const activities = await ctx.db.query.Activities.findMany({
            limit: fetchLimit,
            orderBy: desc(Activities.startTime),
            where: and(...activityConditions),
            with: {
              user: true,
            },
          });

          allItems.push(
            ...activities
              .filter((activity) => activity.startTime)
              .map((activity): TimelineActivity | null => {
                const timestamp =
                  activity.startTime instanceof Date
                    ? activity.startTime
                    : new Date(activity.startTime);

                if (Number.isNaN(timestamp.getTime())) {
                  return null;
                }

                return {
                  data: activity,
                  timestamp,
                  type: 'activity',
                };
              })
              .filter((item): item is TimelineActivity => item !== null),
          );
        }

        // Fetch completed milestones if needed
        if (shouldFetchMilestones) {
          const milestones = await ctx.db.query.Milestones.findMany({
            limit: fetchLimit,
            orderBy: desc(Milestones.achievedDate),
            where: and(
              eq(Milestones.babyId, babyId),
              isNotNull(Milestones.achievedDate),
              cursorDate ? lt(Milestones.achievedDate, cursorDate) : undefined,
            ),
          });

          allItems.push(
            ...milestones
              .map((milestone): TimelineMilestone | null => {
                const achievedDate = milestone.achievedDate;
                const timestamp =
                  achievedDate instanceof Date
                    ? achievedDate
                    : achievedDate
                      ? new Date(achievedDate)
                      : new Date();

                if (Number.isNaN(timestamp.getTime())) {
                  return null;
                }

                return {
                  data: milestone,
                  timestamp,
                  type: 'milestone',
                };
              })
              .filter((item): item is TimelineMilestone => item !== null),
          );
        }

        // Fetch chat messages if needed
        if (shouldFetchChats) {
          const chats = await ctx.db.query.Chats.findMany({
            limit: fetchLimit,
            orderBy: desc(Chats.createdAt),
            where: and(
              eq(Chats.babyId, babyId),
              cursorDate ? lt(Chats.createdAt, cursorDate) : undefined,
            ),
          });

          const firstMessages = await Promise.all(
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

          allItems.push(
            ...firstMessages
              .filter((msg): msg is NonNullable<typeof msg> => msg !== null)
              .map((message): TimelineChatMessage | null => {
                const timestamp =
                  message.createdAt instanceof Date
                    ? message.createdAt
                    : new Date(message.createdAt);

                if (Number.isNaN(timestamp.getTime())) {
                  return null;
                }

                return {
                  data: message as typeof message & {
                    chat: typeof Chats.$inferSelect;
                  },
                  timestamp,
                  type: 'chat',
                };
              })
              .filter((item): item is TimelineChatMessage => item !== null),
          );
        }

        // Sort all items by timestamp (most recent first)
        allItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Apply pagination
        const paginatedItems = allItems.slice(0, limit);

        // Determine the next cursor
        const lastItem = paginatedItems.at(-1);
        const nextCursor =
          paginatedItems.length === limit && lastItem
            ? lastItem.timestamp.toISOString()
            : null;

        return { items: paginatedItems, nextCursor };
      },
    ),
});
