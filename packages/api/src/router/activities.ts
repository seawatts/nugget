import {
  Activities,
  ActivityTypeType,
  Babies,
  FamilyMembers,
  FeedingSourceType,
  insertActivitySchema,
  updateActivitySchema,
} from '@nugget/db/schema';
import { startOfDay } from 'date-fns';
import { and, desc, eq, gte, inArray, isNull, or } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const activitiesRouter = createTRPCRouter({
  // Create a new activity (feeding, etc.)
  create: protectedProcedure
    .input(
      insertActivitySchema
        .omit({
          createdAt: true,
          familyId: true,
          id: true,
          updatedAt: true,
          userId: true,
        })
        .extend({
          babyId: z.string(),
        }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId || !ctx.auth.userId) {
        throw new Error('Authentication required');
      }

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found or does not belong to your family');
      }

      const [activity] = await ctx.db
        .insert(Activities)
        .values({
          ...input,
          familyId: ctx.auth.orgId,
          userId: ctx.auth.userId,
        })
        .returning();

      if (!activity) {
        throw new Error('Failed to create activity');
      }

      // Fetch the activity with user relation for the response
      const activityWithUser = await ctx.db.query.Activities.findFirst({
        where: eq(Activities.id, activity.id),
        with: {
          user: true,
        },
      });

      // Trigger achievement update workflow (non-blocking)
      // Import dynamically to avoid build-time dependency
      const { triggerAchievementUpdate } = await import(
        '../utils/trigger-achievement-update'
      ).catch(() => ({
        triggerAchievementUpdate: async () => {
          /* no-op */
        },
      }));
      triggerAchievementUpdate(input.babyId).catch((error: unknown) => {
        console.error('Failed to trigger achievement update:', error);
      });

      return activityWithUser ?? activity;
    }),

  // Create multiple scheduled feedings at once
  createScheduledBatch: protectedProcedure
    .input(
      z.object({
        babyId: z.string(),
        feedings: z.array(
          z.object({
            amountMl: z.number().optional(),
            feedingSource: z
              .enum(Object.keys(FeedingSourceType) as [string, ...string[]])
              .optional(),
            startTime: z.date(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId || !ctx.auth.userId) {
        throw new Error('Authentication required');
      }

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found');
      }

      const activities = await ctx.db
        .insert(Activities)
        .values(
          input.feedings.map((feeding) => ({
            amountMl: feeding.amountMl,
            babyId: input.babyId,
            familyId: ctx.auth.orgId,
            feedingSource: feeding.feedingSource as
              | (typeof FeedingSourceType)[keyof typeof FeedingSourceType]
              | undefined,
            isScheduled: true,
            startTime: feeding.startTime,
            type: 'feeding' as const,
            userId: ctx.auth.userId,
          })),
        )
        .returning();

      return activities;
    }),

  // Delete an activity
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Authentication required');
      }

      // Verify activity belongs to a baby in the family
      const activity = await ctx.db.query.Activities.findFirst({
        where: eq(Activities.id, input.id),
        with: {
          baby: true,
        },
      });

      if (
        !activity ||
        !activity.baby ||
        activity.baby.familyId !== ctx.auth.orgId
      ) {
        throw new Error('Activity not found or does not belong to your family');
      }

      const [deletedActivity] = await ctx.db
        .delete(Activities)
        .where(eq(Activities.id, input.id))
        .returning();

      if (!deletedActivity) {
        throw new Error('Failed to delete activity');
      }

      // Trigger achievement update workflow (non-blocking)
      // Import dynamically to avoid build-time dependency
      const { triggerAchievementUpdate } = await import(
        '../utils/trigger-achievement-update'
      ).catch(() => ({
        triggerAchievementUpdate: async () => {
          /* no-op */
        },
      }));
      if (deletedActivity.babyId) {
        triggerAchievementUpdate(deletedActivity.babyId).catch(
          (error: unknown) => {
            console.error('Failed to trigger achievement update:', error);
          },
        );
      }

      return { success: true };
    }),

  // Delete all scheduled feedings for a baby
  deleteAllScheduled: protectedProcedure
    .input(z.object({ babyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Authentication required');
      }

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found or does not belong to your family');
      }

      await ctx.db
        .delete(Activities)
        .where(
          and(
            eq(Activities.babyId, input.babyId),
            eq(Activities.type, 'feeding'),
            eq(Activities.isScheduled, true),
          ),
        );

      return { success: true };
    }),

  // Get in-progress activity (has startTime but no endTime) - optimized server-side filtering
  getInProgressActivity: protectedProcedure
    .input(
      z.object({
        activityType: z.enum(['feeding', 'sleep', 'diaper', 'pumping']),
        babyId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Authentication required');
      }

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found or does not belong to your family');
      }

      // Build activity type condition based on input
      const activityTypeCondition =
        input.activityType === 'feeding'
          ? or(eq(Activities.type, 'bottle'), eq(Activities.type, 'nursing'))
          : eq(Activities.type, input.activityType);

      // Query for in-progress activity (has startTime but no endTime)
      const activity = await ctx.db.query.Activities.findFirst({
        orderBy: [desc(Activities.startTime)],
        where: and(
          eq(Activities.babyId, input.babyId),
          activityTypeCondition,
          isNull(Activities.endTime),
        ),
      });

      // Filter out skipped activities (defensive check)
      // Skipped activities should have endTime set, but this ensures they never appear as in-progress
      if (
        activity?.details &&
        'skipped' in activity.details &&
        activity.details.skipped === true
      ) {
        return null;
      }

      return activity || null;
    }),

  // Get last feeding activity for a baby
  getLastFeeding: protectedProcedure
    .input(z.object({ babyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Authentication required');
      }

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found or does not belong to your family');
      }

      return ctx.db.query.Activities.findFirst({
        orderBy: [desc(Activities.startTime)],
        where: and(
          eq(Activities.babyId, input.babyId),
          eq(Activities.type, 'feeding'),
          eq(Activities.isScheduled, false),
        ),
      });
    }),

  // Get scheduled feedings for a baby
  getScheduled: protectedProcedure
    .input(z.object({ babyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Authentication required');
      }

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found or does not belong to your family');
      }

      const now = new Date();
      return ctx.db.query.Activities.findMany({
        orderBy: [Activities.startTime],
        where: and(
          eq(Activities.babyId, input.babyId),
          eq(Activities.type, 'feeding'),
          eq(Activities.isScheduled, true),
          gte(Activities.startTime, now),
        ),
      });
    }),

  // Get today's activities for summary card (optimized query)
  getTodaySummary: protectedProcedure
    .input(z.object({ babyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Authentication required');
      }

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found or does not belong to your family');
      }

      const todayStart = startOfDay(new Date());

      return ctx.db.query.Activities.findMany({
        limit: 50, // Today only - most users have < 20 activities per day
        orderBy: [desc(Activities.startTime)],
        where: and(
          eq(Activities.babyId, input.babyId),
          gte(Activities.startTime, todayStart),
        ),
        with: {
          user: true,
        },
      });
    }),

  // Get upcoming diaper prediction
  getUpcomingDiaper: protectedProcedure
    .input(z.object({ babyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Authentication required');
      }

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found or does not belong to your family');
      }

      // Calculate baby's age in days
      let babyAgeDays: number | null = null;
      if (baby.birthDate) {
        const today = new Date();
        const birth = new Date(baby.birthDate);
        const diffTime = Math.abs(today.getTime() - birth.getTime());
        babyAgeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      // Fetch recent activities (last 72 hours) for prediction
      const seventyTwoHoursAgo = new Date();
      seventyTwoHoursAgo.setHours(seventyTwoHoursAgo.getHours() - 72);

      const recentActivities = await ctx.db.query.Activities.findMany({
        limit: 100,
        orderBy: [desc(Activities.startTime)],
        where: and(
          eq(Activities.babyId, baby.id),
          gte(Activities.startTime, seventyTwoHoursAgo),
        ),
        with: {
          user: true,
        },
      });

      return {
        babyAgeDays,
        babyBirthDate: baby.birthDate,
        recentActivities,
      };
    }),

  // Get upcoming doctor visit prediction
  getUpcomingDoctorVisit: protectedProcedure
    .input(z.object({ babyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Authentication required');
      }

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found or does not belong to your family');
      }

      // Calculate baby's age in days
      let babyAgeDays: number | null = null;
      if (baby.birthDate) {
        const today = new Date();
        const birth = new Date(baby.birthDate);
        const diffTime = Math.abs(today.getTime() - birth.getTime());
        babyAgeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      // Fetch all doctor visit activities for first year
      const recentActivities = await ctx.db.query.Activities.findMany({
        limit: 100,
        orderBy: [desc(Activities.startTime)],
        where: and(
          eq(Activities.babyId, baby.id),
          eq(Activities.type, 'doctor_visit'),
        ),
      });

      return {
        babyAgeDays,
        babyBirthDate: baby.birthDate,
        recentActivities,
      };
    }),

  // Get upcoming feeding prediction
  getUpcomingFeeding: protectedProcedure
    .input(z.object({ babyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Authentication required');
      }

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found or does not belong to your family');
      }

      // Calculate baby's age in days
      let babyAgeDays: number | null = null;
      if (baby.birthDate) {
        const today = new Date();
        const birth = new Date(baby.birthDate);
        const diffTime = Math.abs(today.getTime() - birth.getTime());
        babyAgeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      // Fetch recent activities (last 48 hours) for prediction
      const fortyEightHoursAgo = new Date();
      fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

      const recentActivities = await ctx.db.query.Activities.findMany({
        limit: 200,
        orderBy: [desc(Activities.startTime)],
        where: and(
          eq(Activities.babyId, baby.id),
          gte(Activities.startTime, fortyEightHoursAgo),
        ),
        with: {
          user: true,
        },
      });

      // Get family members for assignment suggestions
      const familyMembers = await ctx.db.query.FamilyMembers.findMany({
        where: eq(FamilyMembers.familyId, ctx.auth.orgId),
        with: {
          user: true,
        },
      });

      // Check for existing scheduled feeding
      const scheduledFeeding = recentActivities.find(
        (a) =>
          a.isScheduled &&
          (a.type === 'bottle' ||
            a.type === 'nursing' ||
            a.type === 'solids') &&
          new Date(a.startTime) > new Date(),
      );

      // Check for in-progress feeding activity (has startTime but no endTime)
      const inProgressActivity = recentActivities.find(
        (a) =>
          (a.type === 'bottle' ||
            a.type === 'nursing' ||
            a.type === 'solids') &&
          a.startTime &&
          !a.endTime,
      );

      // Return data - prediction logic will be handled on client side for now
      return {
        babyAgeDays,
        babyBirthDate: baby.birthDate,
        customPreferences: baby.customPreferences,
        familyMemberCount: familyMembers.length,
        familyMembers,
        feedIntervalHours: baby.feedIntervalHours,
        inProgressActivity: inProgressActivity || null,
        recentActivities,
        scheduledFeeding: scheduledFeeding || null,
      };
    }),

  // Get upcoming pumping prediction
  getUpcomingPumping: protectedProcedure
    .input(z.object({ babyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Authentication required');
      }

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found or does not belong to your family');
      }

      // Calculate baby's age in days
      let babyAgeDays: number | null = null;
      if (baby.birthDate) {
        const today = new Date();
        const birth = new Date(baby.birthDate);
        const diffTime = Math.abs(today.getTime() - birth.getTime());
        babyAgeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      // Fetch recent pumping activities (last 48 hours)
      const fortyEightHoursAgo = new Date();
      fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

      const recentActivities = await ctx.db.query.Activities.findMany({
        limit: 200,
        orderBy: [desc(Activities.startTime)],
        where: and(
          eq(Activities.babyId, baby.id),
          eq(Activities.type, 'pumping'),
          gte(Activities.startTime, fortyEightHoursAgo),
        ),
        with: {
          user: true,
        },
      });

      return {
        babyAgeDays,
        babyBirthDate: baby.birthDate,
        customPreferences: baby.customPreferences,
        recentActivities,
      };
    }),

  // Get upcoming sleep prediction
  getUpcomingSleep: protectedProcedure
    .input(z.object({ babyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Authentication required');
      }

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found or does not belong to your family');
      }

      // Calculate baby's age in days
      let babyAgeDays: number | null = null;
      if (baby.birthDate) {
        const today = new Date();
        const birth = new Date(baby.birthDate);
        const diffTime = Math.abs(today.getTime() - birth.getTime());
        babyAgeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      // Fetch recent sleep activities (last 72 hours)
      const seventyTwoHoursAgo = new Date();
      seventyTwoHoursAgo.setHours(seventyTwoHoursAgo.getHours() - 72);

      const recentActivities = await ctx.db.query.Activities.findMany({
        limit: 200,
        orderBy: [desc(Activities.startTime)],
        where: and(
          eq(Activities.babyId, baby.id),
          eq(Activities.type, 'sleep'),
          gte(Activities.startTime, seventyTwoHoursAgo),
        ),
        with: {
          user: true,
        },
      });

      return {
        babyAgeDays,
        babyBirthDate: baby.birthDate,
        recentActivities,
      };
    }),

  // List activities for a baby with optional filtering
  list: protectedProcedure
    .input(
      z.object({
        activityTypes: z.array(z.string()).optional(),
        babyId: z.string(),
        isScheduled: z.boolean().optional(),
        limit: z.number().min(1).max(1000).default(50),
        since: z.date().optional(),
        type: z
          .enum(Object.keys(ActivityTypeType) as [string, ...string[]])
          .optional(),
        userIds: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Authentication required');
      }

      const {
        babyId,
        limit,
        type,
        isScheduled,
        userIds,
        activityTypes,
        since,
      } = input;

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(eq(Babies.id, babyId), eq(Babies.familyId, ctx.auth.orgId)),
      });

      if (!baby) {
        throw new Error('Baby not found or does not belong to your family');
      }

      const conditions = [eq(Activities.babyId, babyId)];
      if (type) {
        conditions.push(
          eq(
            Activities.type,
            type as (typeof ActivityTypeType)[keyof typeof ActivityTypeType],
          ),
        );
      }
      if (typeof isScheduled === 'boolean') {
        conditions.push(eq(Activities.isScheduled, isScheduled));
      }
      if (userIds && userIds.length > 0) {
        conditions.push(inArray(Activities.userId, userIds));
      }
      if (activityTypes && activityTypes.length > 0) {
        conditions.push(
          inArray(
            Activities.type,
            activityTypes as Array<
              (typeof ActivityTypeType)[keyof typeof ActivityTypeType]
            >,
          ),
        );
      }
      if (since) {
        conditions.push(gte(Activities.startTime, since));
      }

      return ctx.db.query.Activities.findMany({
        limit,
        orderBy: [desc(Activities.startTime)],
        where: and(...conditions),
        with: {
          user: true,
        },
      });
    }),

  // Update an activity
  update: protectedProcedure
    .input(
      updateActivitySchema.required({ id: true }).omit({
        babyId: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Authentication required');
      }

      const { id, ...data } = input;

      // Verify activity belongs to a baby in the family
      const activity = await ctx.db.query.Activities.findFirst({
        where: eq(Activities.id, id),
        with: {
          baby: true,
        },
      });

      if (
        !activity ||
        !activity.baby ||
        activity.baby.familyId !== ctx.auth.orgId
      ) {
        throw new Error('Activity not found or does not belong to your family');
      }

      const [updatedActivity] = await ctx.db
        .update(Activities)
        .set(data)
        .where(eq(Activities.id, id))
        .returning();

      if (!updatedActivity) {
        throw new Error('Failed to update activity');
      }

      // Trigger achievement update workflow (non-blocking)
      // Import dynamically to avoid build-time dependency
      const { triggerAchievementUpdate } = await import(
        '../utils/trigger-achievement-update'
      ).catch(() => ({
        triggerAchievementUpdate: async () => {
          /* no-op */
        },
      }));
      if (updatedActivity.babyId) {
        triggerAchievementUpdate(updatedActivity.babyId).catch(
          (error: unknown) => {
            console.error('Failed to trigger achievement update:', error);
          },
        );
      }

      return updatedActivity;
    }),
});
