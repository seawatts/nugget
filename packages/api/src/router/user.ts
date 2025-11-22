import { eq } from '@nugget/db';
import {
  CreateUserSchema,
  MeasurementUnitType,
  TemperatureUnitType,
  ThemeType,
  TimeFormatType,
  Users,
} from '@nugget/db/schema';
import type { TRPCRouterRecord } from '@trpc/server';
import { z } from 'zod';

import { protectedProcedure, publicProcedure } from '../trpc';

export const userRouter = {
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.Users.findMany({
      limit: 10,
    });
  }),
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.Users.findFirst({
        where: eq(Users.id, input.id),
      });
    }),
  create: protectedProcedure
    .input(CreateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .insert(Users)
        .values({
          ...input,
          defaultHomeScreenType: input.defaultHomeScreenType as
            | 'baby'
            | 'user'
            | null
            | undefined,
          id: crypto.randomUUID(),
        })
        .returning();
      return user;
    }),
  current: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.Users.findFirst({
      where: eq(Users.id, ctx.auth.userId),
    });
  }),
  delete: publicProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
    const result = await ctx.db
      .delete(Users)
      .where(eq(Users.id, input))
      .returning();
    return result[0];
  }),

  // Delete current user account and all associated data
  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.auth.userId) {
      throw new Error('User ID is required');
    }

    // Verify user exists
    const user = await ctx.db.query.Users.findFirst({
      where: eq(Users.id, ctx.auth.userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Delete the user (cascades to orgs, org members, babies, activities, etc.)
    const [deletedUser] = await ctx.db
      .delete(Users)
      .where(eq(Users.id, ctx.auth.userId))
      .returning();

    if (!deletedUser) {
      throw new Error('Failed to delete user account');
    }

    return { success: true };
  }),

  // Update user home screen preference
  updateHomeScreenPreference: protectedProcedure
    .input(
      z.object({
        defaultHomeScreenId: z.string(),
        defaultHomeScreenType: z.enum(['baby', 'user']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.userId) {
        throw new Error('User ID is required');
      }

      const [updatedUser] = await ctx.db
        .update(Users)
        .set({
          defaultHomeScreenId: input.defaultHomeScreenId,
          defaultHomeScreenType: input.defaultHomeScreenType,
        })
        .where(eq(Users.id, ctx.auth.userId))
        .returning();

      if (!updatedUser) {
        throw new Error('Failed to update home screen preference');
      }

      return updatedUser;
    }),

  // Update user preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        measurementUnit: z
          .enum([MeasurementUnitType.imperial, MeasurementUnitType.metric])
          .optional(),
        quickLogDiaperUsePredictedType: z.boolean().optional(),
        // Quick log preferences
        quickLogEnabled: z.boolean().optional(),
        quickLogFeedingUseLastAmount: z.boolean().optional(),
        quickLogFeedingUseLastType: z.boolean().optional(),
        quickLogFeedingUseTypicalDuration: z.boolean().optional(),
        quickLogPumpingUseLastVolume: z.boolean().optional(),
        quickLogPumpingUseTypicalDuration: z.boolean().optional(),
        quickLogSleepUseSuggestedDuration: z.boolean().optional(),
        showActivityGoals: z.boolean().optional(),
        showPredictiveTimes: z.boolean().optional(),
        temperatureUnit: z
          .enum([TemperatureUnitType.fahrenheit, TemperatureUnitType.celsius])
          .optional(),
        theme: z
          .enum([ThemeType.light, ThemeType.dark, ThemeType.system])
          .optional(),
        timeFormat: z
          .enum([TimeFormatType['12h'], TimeFormatType['24h']])
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.userId) {
        throw new Error('User ID is required');
      }

      const [updatedUser] = await ctx.db
        .update(Users)
        .set(input)
        .where(eq(Users.id, ctx.auth.userId))
        .returning();

      if (!updatedUser) {
        throw new Error('Failed to update preferences');
      }

      return updatedUser;
    }),
} satisfies TRPCRouterRecord;
