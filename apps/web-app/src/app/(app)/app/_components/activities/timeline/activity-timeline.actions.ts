'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@nugget/db/client';
import {
  type Activities,
  Activities as ActivitiesTable,
  Babies,
  type ChatMessages,
  ChatMessages as ChatMessagesTable,
  Chats,
  type Chats as ChatsType,
  type Milestones,
  Milestones as MilestonesTable,
} from '@nugget/db/schema';
import { and, asc, desc, eq, inArray, isNotNull, lt } from 'drizzle-orm';
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
  babyId: z.string(),
  cursor: z.string().optional(), // ISO timestamp of the oldest item from the previous page
  itemTypes: z.array(z.enum(['activity', 'milestone', 'chat'])).optional(),
  limit: z.number().min(1).max(100).default(30),
  userIds: z.array(z.string()).optional(),
});

/**
 * Fetch paginated timeline items (activities, milestones, chats) for the current user's baby
 * Uses cursor-based pagination for infinite scroll
 */
export const getActivitiesAction = action
  .schema(getActivitiesInputSchema)
  .action(
    async ({
      parsedInput,
    }): Promise<{
      items: TimelineItem[];
      nextCursor: string | null;
    }> => {
      // Verify authentication
      const authResult = await auth();
      if (!authResult.userId || !authResult.orgId) {
        throw new Error('Authentication required');
      }

      const { babyId, itemTypes, activityTypes, userIds, limit, cursor } =
        parsedInput;

      // Verify baby belongs to user's family
      const babyCheck = await db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, babyId),
          eq(Babies.familyId, authResult.orgId),
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
      // We'll fetch limit * 3 to ensure we have enough items after merging
      const fetchLimit = Math.min(limit * 3, 1000);

      // Fetch activities if needed (no time limit - unlimited history)
      if (shouldFetchActivities) {
        const activityConditions = [
          eq(ActivitiesTable.babyId, babyId),
          eq(ActivitiesTable.isScheduled, false),
        ];

        // Apply cursor filter if we have one (fetch items older than cursor)
        if (cursorDate) {
          activityConditions.push(lt(ActivitiesTable.startTime, cursorDate));
        }

        // Filter by activity types if specified
        if (activityTypes && activityTypes.length > 0) {
          activityConditions.push(
            // biome-ignore lint/suspicious/noExplicitAny: drizzle type inference limitation with enum columns
            inArray(ActivitiesTable.type, activityTypes as any),
          );
        }

        // Filter by user IDs if specified
        if (userIds && userIds.length > 0) {
          activityConditions.push(inArray(ActivitiesTable.userId, userIds));
        }

        const activities = await db.query.Activities.findMany({
          limit: fetchLimit,
          orderBy: desc(ActivitiesTable.startTime),
          where: and(...activityConditions),
        });

        const lastActivity = activities.at(-1);
        console.log('[Server] Activities query result:', {
          count: activities.length,
          cursorDate: cursorDate?.toISOString(),
          firstActivity: activities[0]
            ? {
                id: activities[0].id,
                startTime: activities[0].startTime,
                startTimeISO:
                  activities[0].startTime instanceof Date
                    ? activities[0].startTime.toISOString()
                    : new Date(activities[0].startTime).toISOString(),
                type: activities[0].type,
              }
            : null,
          lastActivity: lastActivity
            ? {
                id: lastActivity.id,
                startTime: lastActivity.startTime,
                type: lastActivity.type,
              }
            : null,
        });

        allItems.push(
          ...activities
            .filter((activity) => activity.startTime) // Filter out activities without startTime
            .map((activity): TimelineActivity | null => {
              // Ensure proper date conversion - database returns Date objects via Drizzle
              // but we want to make sure they're proper JavaScript Date instances
              const timestamp =
                activity.startTime instanceof Date
                  ? activity.startTime
                  : new Date(activity.startTime);

              // Validate that the timestamp is a valid date
              if (Number.isNaN(timestamp.getTime())) {
                console.warn(
                  'Activity has invalid startTime, skipping:',
                  activity.id,
                  activity.startTime,
                );
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
        const milestones = await db.query.Milestones.findMany({
          limit: fetchLimit,
          orderBy: desc(MilestonesTable.achievedDate),
          where: and(
            eq(MilestonesTable.babyId, babyId),
            isNotNull(MilestonesTable.achievedDate),
            // Apply cursor filter if we have one (fetch items older than cursor)
            cursorDate
              ? lt(MilestonesTable.achievedDate, cursorDate)
              : undefined,
          ),
        });

        allItems.push(
          ...milestones
            .map((milestone): TimelineMilestone | null => {
              // Ensure proper date conversion
              const achievedDate = milestone.achievedDate;
              const timestamp =
                achievedDate instanceof Date
                  ? achievedDate
                  : achievedDate
                    ? new Date(achievedDate)
                    : new Date();

              // Validate that the timestamp is a valid date
              if (Number.isNaN(timestamp.getTime())) {
                console.warn(
                  'Milestone has invalid achievedDate, skipping:',
                  milestone.id,
                  achievedDate,
                );
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
        // Get all chats for this baby, ordered by most recent
        const chats = await db.query.Chats.findMany({
          limit: fetchLimit,
          orderBy: desc(Chats.createdAt),
          where: and(
            eq(Chats.babyId, babyId),
            // Apply cursor filter if we have one (fetch items older than cursor)
            cursorDate ? lt(Chats.createdAt, cursorDate) : undefined,
          ),
        });

        // For each chat, get the first message
        const firstMessages = await Promise.all(
          chats.map(async (chat) => {
            const firstMessage = await db.query.ChatMessages.findFirst({
              orderBy: asc(ChatMessagesTable.createdAt),
              where: eq(ChatMessagesTable.chatId, chat.id),
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
              // Ensure proper date conversion
              const timestamp =
                message.createdAt instanceof Date
                  ? message.createdAt
                  : new Date(message.createdAt);

              // Validate that the timestamp is a valid date
              if (Number.isNaN(timestamp.getTime())) {
                console.warn(
                  'Chat message has invalid createdAt, skipping:',
                  message.id,
                  message.createdAt,
                );
                return null;
              }

              return {
                data: message as typeof message & {
                  chat: typeof ChatsType.$inferSelect;
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

      // Apply pagination - take only the requested number of items
      const paginatedItems = allItems.slice(0, limit);

      // Determine the next cursor (oldest timestamp from this page)
      // If we have a full page of items, the cursor is the oldest item's timestamp
      const lastItem = paginatedItems.at(-1);
      const nextCursor =
        paginatedItems.length === limit && lastItem
          ? lastItem.timestamp.toISOString()
          : null;

      return { items: paginatedItems, nextCursor };
    },
  );
