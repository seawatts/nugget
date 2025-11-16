'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import { db } from '@nugget/db/client';
import {
  type Activities,
  type ChatMessages,
  ChatMessages as ChatMessagesTable,
  Chats,
  type Chats as ChatsType,
  type Milestones,
  Milestones as MilestonesTable,
} from '@nugget/db/schema';
import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

// Discriminated union types for timeline items
export type TimelineActivity = {
  type: 'activity';
  data: typeof Activities.$inferSelect;
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
    chat: typeof ChatsType.$inferSelect;
  };
  timestamp: Date;
};

export type TimelineItem =
  | TimelineActivity
  | TimelineMilestone
  | TimelineChatMessage;

const getActivitiesInputSchema = z.object({
  activityTypes: z.array(z.string()).optional(),
  itemTypes: z.array(z.enum(['activity', 'milestone', 'chat'])).optional(),
  limit: z.number().min(1).max(100).default(30),
  offset: z.number().min(0).default(0),
  userIds: z.array(z.string()).optional(),
});

/**
 * Fetch paginated timeline items (activities, milestones, chats) for the current user's baby
 */
export const getActivitiesAction = action
  .schema(getActivitiesInputSchema)
  .action(
    async ({
      parsedInput,
    }): Promise<{
      items: TimelineItem[];
      hasMore: boolean;
    }> => {
      // Verify authentication
      const authResult = await auth();
      if (!authResult.userId) {
        throw new Error('Authentication required');
      }

      // Create tRPC API helper
      const api = await getApi();

      // Get the most recent baby
      const baby = await api.babies.getMostRecent();

      if (!baby) {
        return { hasMore: false, items: [] };
      }

      const { itemTypes, activityTypes, userIds, limit, offset } = parsedInput;

      // Determine which types to fetch (default to all if not specified)
      const shouldFetchActivities =
        !itemTypes || itemTypes.includes('activity');
      const shouldFetchMilestones =
        !itemTypes || itemTypes.includes('milestone');
      const shouldFetchChats = !itemTypes || itemTypes.includes('chat');

      const allItems: TimelineItem[] = [];

      // Fetch more items than the limit to account for interleaving different types
      // We'll fetch limit * 3 to ensure we have enough items after merging
      const fetchLimit = Math.min(limit * 3, 100);

      // Fetch activities if needed
      if (shouldFetchActivities) {
        const activities = await api.activities.list({
          activityTypes,
          babyId: baby.id,
          isScheduled: false,
          limit: fetchLimit,
          userIds,
        });

        allItems.push(
          ...activities.map(
            (activity): TimelineActivity => ({
              data: activity,
              timestamp: new Date(activity.startTime),
              type: 'activity',
            }),
          ),
        );
      }

      // Fetch completed milestones if needed
      if (shouldFetchMilestones) {
        const milestones = await db.query.Milestones.findMany({
          limit: fetchLimit,
          orderBy: desc(MilestonesTable.achievedDate),
          where: and(
            eq(MilestonesTable.babyId, baby.id),
            isNotNull(MilestonesTable.achievedDate),
          ),
        });

        allItems.push(
          ...milestones.map(
            (milestone): TimelineMilestone => ({
              data: milestone,
              timestamp: milestone.achievedDate
                ? new Date(milestone.achievedDate)
                : new Date(),
              type: 'milestone',
            }),
          ),
        );
      }

      // Fetch chat messages if needed
      if (shouldFetchChats) {
        // First get all chats for this baby
        const chats = await db.query.Chats.findMany({
          where: eq(Chats.babyId, baby.id),
        });

        const chatIds = chats.map((chat) => chat.id);

        if (chatIds.length > 0) {
          const chatMessages = await db.query.ChatMessages.findMany({
            limit: fetchLimit,
            orderBy: desc(ChatMessagesTable.createdAt),
            where: inArray(ChatMessagesTable.chatId, chatIds),
            with: {
              chat: true,
            },
          });

          allItems.push(
            ...chatMessages
              .filter((msg) => msg.chat)
              .map(
                (message): TimelineChatMessage => ({
                  data: message as typeof message & {
                    chat: typeof ChatsType.$inferSelect;
                  },
                  timestamp: new Date(message.createdAt),
                  type: 'chat',
                }),
              ),
          );
        }
      }

      // Sort all items by timestamp (most recent first)
      allItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply pagination - skip offset items and take limit items
      const paginatedItems = allItems.slice(offset, offset + limit);

      // For hasMore, we need to check if there are potentially more items
      // Since we fetched fetchLimit of each type, if we have fetchLimit items of any type,
      // there might be more
      const hasMore = allItems.length >= offset + limit;

      return { hasMore, items: paginatedItems };
    },
  );
