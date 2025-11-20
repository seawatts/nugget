import { createId } from '@nugget/id';
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';

// ============================================================================
// Helper Functions
// ============================================================================

// Helper function to get user ID from Clerk JWT
const requestingUserId = () => sql`requesting_user_id()`;

// Helper function to get family ID from Clerk JWT
const requestingFamilyId = () => sql`requesting_family_id()`;

// ============================================================================
// Enums
// ============================================================================

export const userRoleEnum = pgEnum('userRole', [
  'primary',
  'partner',
  'caregiver',
]);
export const localConnectionStatusEnum = pgEnum('localConnectionStatus', [
  'connected',
  'disconnected',
]);
export const stripeSubscriptionStatusEnum = pgEnum('stripeSubscriptionStatus', [
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'paused',
  'trialing',
  'unpaid',
]);
export const activityTypeEnum = pgEnum('activityType', [
  'sleep',
  'feeding',
  'bottle',
  'nursing',
  'pumping',
  'diaper',
  'wet',
  'dirty',
  'both',
  'solids',
  'bath',
  'medicine',
  'temperature',
  'tummy_time',
  'growth',
  'potty',
]);
export const activitySubjectTypeEnum = pgEnum('activitySubjectType', [
  'baby',
  'family_member',
]);
export const milestoneTypeEnum = pgEnum('milestoneType', [
  'physical',
  'cognitive',
  'social',
  'language',
  'self_care',
]);
export const celebrationTypeEnum = pgEnum('celebrationType', [
  'week_1',
  'week_2',
  'week_3',
  'week_4',
  'week_5',
  'week_6',
  'week_7',
  'week_8',
  'week_9',
  'week_10',
  'week_11',
  'week_12',
  'month_1',
  'month_2',
  'month_3',
  'month_4',
  'month_5',
  'month_6',
  'month_9',
  'year_1',
  'month_18',
  'year_2',
]);
export const feedingSourceEnum = pgEnum('feedingSource', [
  'pumped',
  'donor',
  'direct',
  'formula',
]);
export const unitPrefEnum = pgEnum('unitPref', ['ML', 'OZ']);
export const supplyTransactionTypeEnum = pgEnum('supplyTransactionType', [
  'add',
  'deduct',
]);
export const journeyStageEnum = pgEnum('journeyStage', [
  'ttc',
  'pregnant',
  'born',
]);
export const ttcMethodEnum = pgEnum('ttcMethod', ['natural', 'ivf', 'other']);
export const measurementUnitEnum = pgEnum('measurementUnit', [
  'imperial',
  'metric',
]);
export const checkInResponseTypeEnum = pgEnum('checkInResponseType', [
  'emoji_scale',
  'yes_no',
  'rating_1_5',
  'text_short',
]);
export const checkInCategoryEnum = pgEnum('checkInCategory', [
  'physical',
  'emotional',
  'support',
  'baby_concern',
  'self_care',
]);
export const taskCategoryEnum = pgEnum('taskCategory', [
  'baby_care',
  'household',
  'self_care',
  'relationship',
  'preparation',
]);
export const taskPriorityEnum = pgEnum('taskPriority', [
  'high',
  'medium',
  'low',
]);
export const wellnessQuestionCategoryEnum = pgEnum('wellnessQuestionCategory', [
  'mood',
  'anxiety',
  'bonding',
  'coping',
  'thoughts',
]);
export const diaperSizeEnum = pgEnum('diaperSize', [
  'little',
  'medium',
  'large',
]);
export const diaperConsistencyEnum = pgEnum('diaperConsistency', [
  'solid',
  'loose',
  'runny',
  'mucousy',
  'hard',
  'pebbles',
  'diarrhea',
]);
export const diaperColorEnum = pgEnum('diaperColor', [
  'yellow',
  'brown',
  'green',
  'black',
  'red',
  'white',
  'orange',
]);
export const temperatureUnitEnum = pgEnum('temperatureUnit', [
  'fahrenheit',
  'celsius',
]);
export const timeFormatEnum = pgEnum('timeFormat', ['12h', '24h']);
export const themeEnum = pgEnum('theme', ['light', 'dark', 'system']);
export const sleepQualityEnum = pgEnum('sleepQuality', [
  'peaceful',
  'restless',
  'fussy',
  'crying',
]);
export const sleepLocationEnum = pgEnum('sleepLocation', [
  'crib',
  'bassinet',
  'bed',
  'car_seat',
  'stroller',
  'arms',
  'swing',
  'bouncer',
]);
export const wakeReasonEnum = pgEnum('wakeReason', [
  'hungry',
  'diaper',
  'crying',
  'naturally',
  'noise',
  'unknown',
]);
export const messageRoleEnum = pgEnum('messageRole', ['user', 'assistant']);
export const questionAnswerEnum = pgEnum('questionAnswer', ['yes', 'no']);

// Zod enum types
export const UserRoleType = z.enum(userRoleEnum.enumValues).enum;
export const LocalConnectionStatusType = z.enum(
  localConnectionStatusEnum.enumValues,
).enum;
export const StripeSubscriptionStatusType = z.enum(
  stripeSubscriptionStatusEnum.enumValues,
).enum;
export const ActivityTypeType = z.enum(activityTypeEnum.enumValues).enum;
export const MilestoneTypeType = z.enum(milestoneTypeEnum.enumValues).enum;
export const CelebrationTypeType = z.enum(celebrationTypeEnum.enumValues).enum;
export const FeedingSourceType = z.enum(feedingSourceEnum.enumValues).enum;
export const UnitPrefType = z.enum(unitPrefEnum.enumValues).enum;
export const SupplyTransactionTypeType = z.enum(
  supplyTransactionTypeEnum.enumValues,
).enum;
export const JourneyStageType = z.enum(journeyStageEnum.enumValues).enum;
export const TTCMethodType = z.enum(ttcMethodEnum.enumValues).enum;
export const MeasurementUnitType = z.enum(measurementUnitEnum.enumValues).enum;
export const TemperatureUnitType = z.enum(temperatureUnitEnum.enumValues).enum;
export const TimeFormatType = z.enum(timeFormatEnum.enumValues).enum;
export const ThemeType = z.enum(themeEnum.enumValues).enum;
export const SleepQualityType = z.enum(sleepQualityEnum.enumValues).enum;
export const SleepLocationType = z.enum(sleepLocationEnum.enumValues).enum;
export const WakeReasonType = z.enum(wakeReasonEnum.enumValues).enum;
export const MessageRoleType = z.enum(messageRoleEnum.enumValues).enum;
export const QuestionAnswerType = z.enum(questionAnswerEnum.enumValues).enum;

// ============================================================================
// Tables - Users & Families
// ============================================================================

export const Users = pgTable('users', {
  avatarUrl: text('avatarUrl'),
  clerkId: text('clerkId').unique().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  email: text('email').notNull(),
  firstName: text('firstName'),
  id: varchar('id', { length: 128 }).notNull().primaryKey(),
  lastLoggedInAt: timestamp('lastLoggedInAt', {
    mode: 'date',
    withTimezone: true,
  }),
  lastName: text('lastName'),
  // User preferences
  measurementUnit: measurementUnitEnum('measurementUnit')
    .default('imperial')
    .notNull(),
  online: boolean('online').default(false).notNull(),
  temperatureUnit: temperatureUnitEnum('temperatureUnit')
    .default('fahrenheit')
    .notNull(),
  theme: themeEnum('theme').default('system').notNull(),
  timeFormat: timeFormatEnum('timeFormat').default('12h').notNull(),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
});

export const Families = pgTable('families', {
  clerkOrgId: text('clerkOrgId').unique().notNull(),
  createdAt: timestamp('createdAt', {
    mode: 'date',
    withTimezone: true,
  }).defaultNow(),
  createdByUserId: varchar('createdByUserId')
    .references(() => Users.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'family' }))
    .notNull()
    .primaryKey(),
  name: text('name').notNull().unique(),
  // Stripe fields
  stripeCustomerId: text('stripeCustomerId'),
  stripeSubscriptionId: text('stripeSubscriptionId'),
  stripeSubscriptionStatus: stripeSubscriptionStatusEnum(
    'stripeSubscriptionStatus',
  ),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
});

export const FamilyMembers = pgTable(
  'familyMembers',
  {
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    }).defaultNow(),
    familyId: varchar('familyId')
      .references(() => Families.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(requestingFamilyId()),
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'member' }))
      .notNull()
      .primaryKey(),
    onboardingCompletedAt: timestamp('onboardingCompletedAt', {
      mode: 'date',
      withTimezone: true,
    }),
    role: userRoleEnum('role').default('primary').notNull(),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      withTimezone: true,
    }).$onUpdateFn(() => new Date()),
    userId: varchar('userId')
      .references(() => Users.id, {
        onDelete: 'cascade',
      })
      .notNull()
      .default(requestingUserId()),
    userRole: userRoleEnum('userRole'),
  },
  (table) => [
    unique().on(table.userId, table.familyId),
    // Index for RLS policy lookups - speeds up family member queries
    index('familyMembers_userId_idx').on(table.userId),
    index('familyMembers_familyId_idx').on(table.familyId),
  ],
);

export const ShortUrls = pgTable('shortUrls', {
  code: varchar('code', { length: 128 }).notNull(),
  createdAt: timestamp('createdAt', {
    mode: 'date',
    withTimezone: true,
  }).defaultNow(),
  expiresAt: timestamp('expiresAt', {
    mode: 'date',
    withTimezone: true,
  }),
  familyId: varchar('familyId')
    .references(() => Families.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(requestingFamilyId()),
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'shortUrl' }))
    .notNull()
    .primaryKey(),
  isActive: boolean('isActive').notNull().default(true),
  redirectUrl: text('redirectUrl').notNull(),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
  userId: varchar('userId')
    .references(() => Users.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(requestingUserId()),
});

export const pushSubscriptions = pgTable('pushSubscriptions', {
  auth: text('auth').notNull(),
  createdAt: timestamp('createdAt', {
    mode: 'date',
    withTimezone: true,
  }).defaultNow(),
  endpoint: text('endpoint').notNull().unique(),
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'pushSub' }))
    .notNull()
    .primaryKey(),
  p256dh: text('p256dh').notNull(),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
  userId: varchar('userId')
    .references(() => Users.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(requestingUserId()),
});

export const Invitations = pgTable('invitations', {
  code: varchar('code', { length: 128 }).notNull().unique(),
  createdAt: timestamp('createdAt', {
    mode: 'date',
    withTimezone: true,
  }).defaultNow(),
  expiresAt: timestamp('expiresAt', {
    mode: 'date',
    withTimezone: true,
  }).notNull(),
  familyId: varchar('familyId')
    .references(() => Families.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(requestingFamilyId()),
  id: varchar('id', { length: 128 })
    .$defaultFn(() => createId({ prefix: 'invite' }))
    .notNull()
    .primaryKey(),
  invitedByUserId: varchar('invitedByUserId')
    .references(() => Users.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(requestingUserId()),
  isActive: boolean('isActive').notNull().default(true),
  role: userRoleEnum('role').default('partner').notNull(),
  updatedAt: timestamp('updatedAt', {
    mode: 'date',
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
  usedAt: timestamp('usedAt', {
    mode: 'date',
    withTimezone: true,
  }),
  usedByUserId: varchar('usedByUserId').references(() => Users.id, {
    onDelete: 'set null',
  }),
});

// ============================================================================
// Activity Details Zod Schemas (defined before table for type reference)
// ============================================================================

// Nursing/Breastfeeding details
export const nursingDetailsSchema = z.object({
  side: z.enum(['left', 'right', 'both']),
  skipped: z.boolean().optional(),
  skipReason: z.string().optional(),
});

// Diaper details
export const diaperDetailsSchema = z.object({
  color: z
    .enum(['yellow', 'brown', 'green', 'black', 'red', 'white', 'orange'])
    .optional(),
  consistency: z
    .enum(['solid', 'loose', 'runny', 'mucousy', 'hard', 'pebbles', 'diarrhea'])
    .optional(),
  size: z.enum(['little', 'medium', 'large']).optional(),
  skipped: z.boolean().optional(),
  skipReason: z.string().optional(),
});

// Medicine details
export const medicineDetailsSchema = z.object({
  dosage: z.string(),
  name: z.string(),
});

// Pumping details (separate amounts for each breast)
export const pumpingDetailsSchema = z.object({
  isColostrum: z.boolean().optional(),
  leftBreastMl: z.number().optional(),
  rightBreastMl: z.number().optional(),
  skipped: z.boolean().optional(),
  skipReason: z.string().optional(),
});

// Solid food details
export const solidFoodDetailsSchema = z.object({
  items: z.array(
    z.object({
      allergenInfo: z.string().optional(),
      foodName: z.string(),
      notes: z.string().optional(),
      portion: z.string().optional(),
      reaction: z
        .enum([
          'none',
          'liked',
          'disliked',
          'allergic',
          'rash',
          'vomiting',
          'other',
        ])
        .default('none'),
    }),
  ),
});

// Temperature details
export const temperatureDetailsSchema = z.object({
  method: z
    .enum(['oral', 'rectal', 'axillary', 'temporal', 'tympanic'])
    .optional(),
  temperatureFahrenheit: z.number(),
});

// Sleep details
export const sleepDetailsSchema = z.object({
  coSleepingWith: z.array(z.string()).optional(), // Array of user IDs who are co-sleeping
  isCoSleeping: z.boolean().optional(), // Whether this is a co-sleeping session
  location: z
    .enum([
      'crib',
      'bassinet',
      'bed',
      'car_seat',
      'stroller',
      'arms',
      'swing',
      'bouncer',
    ])
    .optional(),
  quality: z.enum(['peaceful', 'restless', 'fussy', 'crying']).optional(),
  skipped: z.boolean().optional(),
  skipReason: z.string().optional(),
  sleepType: z.enum(['nap', 'night']),
  wakeReason: z
    .enum(['hungry', 'diaper', 'crying', 'naturally', 'noise', 'unknown'])
    .optional(),
});

// Discriminated union for all activity details
export const activityDetailsSchema = z
  .discriminatedUnion('type', [
    z.object({ type: z.literal('nursing'), ...nursingDetailsSchema.shape }),
    z.object({ type: z.literal('diaper'), ...diaperDetailsSchema.shape }),
    z.object({ type: z.literal('wet'), ...diaperDetailsSchema.shape }),
    z.object({ type: z.literal('dirty'), ...diaperDetailsSchema.shape }),
    z.object({ type: z.literal('both'), ...diaperDetailsSchema.shape }),
    z.object({ type: z.literal('medicine'), ...medicineDetailsSchema.shape }),
    z.object({ type: z.literal('pumping'), ...pumpingDetailsSchema.shape }),
    z.object({ type: z.literal('solids'), ...solidFoodDetailsSchema.shape }),
    z.object({
      type: z.literal('temperature'),
      ...temperatureDetailsSchema.shape,
    }),
    z.object({ type: z.literal('sleep'), ...sleepDetailsSchema.shape }),
  ])
  .nullable();

export type ActivityDetails = z.infer<typeof activityDetailsSchema>;

// Helper type exports for activity details
export type NursingDetails = z.infer<typeof nursingDetailsSchema>;
export type DiaperDetails = z.infer<typeof diaperDetailsSchema>;
export type MedicineDetails = z.infer<typeof medicineDetailsSchema>;
export type PumpingDetails = z.infer<typeof pumpingDetailsSchema>;
export type SolidFoodDetails = z.infer<typeof solidFoodDetailsSchema>;
export type TemperatureDetails = z.infer<typeof temperatureDetailsSchema>;
export type SleepDetails = z.infer<typeof sleepDetailsSchema>;

// ============================================================================
// Tables - Baby Tracking
// ============================================================================

export const Babies = pgTable('babies', {
  avatarBackgroundColor: text('avatarBackgroundColor'), // Background color when photo is hidden
  birthDate: timestamp('birthDate', { mode: 'date' }),
  birthWeightOz: integer('birthWeightOz'), // Birth weight in ounces
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  currentWeightOz: integer('currentWeightOz'), // Current weight in ounces
  dueDate: timestamp('dueDate', { mode: 'date' }),
  familyId: varchar('familyId', { length: 128 })
    .references(() => Families.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .default(requestingFamilyId()),
  feedIntervalHours: integer('feedIntervalHours').default(2.5), // Hours between feeds
  firstName: text('firstName').notNull(),
  gender: text('gender'),
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId({ prefix: 'baby' })),
  journeyStage: journeyStageEnum('journeyStage'),
  lastName: text('lastName'),
  metadata: json('metadata').$type<Record<string, unknown>>(),
  middleName: text('middleName'),
  mlPerPump: integer('mlPerPump').default(24), // ML per pump session
  photoUrl: text('photoUrl'),
  pumpsPerDay: integer('pumpsPerDay').default(6), // Number of pumps per day
  ttcMethod: ttcMethodEnum('ttcMethod'),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  userId: varchar('userId', { length: 128 })
    .notNull()
    .default(requestingUserId()),
});

export const Activities = pgTable('activities', {
  amount: integer('amount'), // for feeding, in ml
  assignedUserId: varchar('assignedUserId', { length: 128 }).references(
    () => Users.id,
    { onDelete: 'set null' },
  ), // User assigned to complete this scheduled feeding
  babyId: varchar('babyId', { length: 128 }).references(() => Babies.id, {
    onDelete: 'cascade',
  }), // Baby the activity is about (when subjectType = 'baby')
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  details: json('details').$type<ActivityDetails>(),
  duration: integer('duration'), // in minutes
  endTime: timestamp('endTime', { mode: 'date' }),
  familyId: varchar('familyId', { length: 128 })
    .notNull()
    .references(() => Families.id, { onDelete: 'cascade' })
    .default(requestingFamilyId()),
  familyMemberId: varchar('familyMemberId', { length: 128 }).references(
    () => FamilyMembers.id,
    { onDelete: 'cascade' },
  ), // Family member the activity is about (when subjectType = 'family_member')
  feedingSource: feedingSourceEnum('feedingSource'), // Source of milk/formula for feeding activities
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId({ prefix: 'activity' })),
  isScheduled: boolean('isScheduled').default(false).notNull(), // Whether this is a scheduled/future feed
  notes: text('notes'),
  startTime: timestamp('startTime', { mode: 'date' }).notNull(),
  subjectType: activitySubjectTypeEnum('subjectType').notNull().default('baby'), // What/who the activity is about
  type: activityTypeEnum('type').notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  userId: varchar('userId', { length: 128 })
    .notNull()
    .default(requestingUserId()),
});

export const MedicalRecords = pgTable('medicalRecords', {
  babyId: varchar('babyId', { length: 128 })
    .notNull()
    .references(() => Babies.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  date: timestamp('date', { mode: 'date' }).notNull(),
  description: text('description'),
  familyId: varchar('familyId', { length: 128 })
    .notNull()
    .references(() => Families.id, { onDelete: 'cascade' })
    .default(requestingFamilyId()),
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId({ prefix: 'medical' })),
  location: text('location'),
  metadata: json('metadata').$type<Record<string, unknown>>(),
  provider: text('provider'),
  title: text('title').notNull(),
  type: text('type').notNull(), // 'vaccination', 'appointment', 'medication', 'illness'
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  userId: varchar('userId', { length: 128 })
    .notNull()
    .default(requestingUserId()),
});

export const Milestones = pgTable('milestones', {
  achievedDate: timestamp('achievedDate', { mode: 'date' }), // Nullable - null means not yet completed
  babyId: varchar('babyId', { length: 128 })
    .notNull()
    .references(() => Babies.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  description: text('description'),
  familyId: varchar('familyId', { length: 128 })
    .notNull()
    .references(() => Families.id, { onDelete: 'cascade' })
    .default(requestingFamilyId()),
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId({ prefix: 'milestone' })),
  isSuggested: boolean('isSuggested').default(false).notNull(), // True for system-suggested milestones
  metadata: json('metadata').$type<Record<string, unknown>>(),
  photoUrl: text('photoUrl'),
  suggestedDay: integer('suggestedDay'), // Which postpartum day this milestone is suggested for (null for user-created)
  title: text('title').notNull(),
  type: milestoneTypeEnum('type').notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  userId: varchar('userId', { length: 128 })
    .notNull()
    .default(requestingUserId()),
});

// ============================================================================
// Tables - Celebrations
// ============================================================================

export const CelebrationMemories = pgTable('celebrationMemories', {
  babyId: varchar('babyId', { length: 128 })
    .notNull()
    .references(() => Babies.id, { onDelete: 'cascade' }),
  celebrationDate: timestamp('celebrationDate', { mode: 'date' })
    .notNull()
    .defaultNow(),
  celebrationType: celebrationTypeEnum('celebrationType').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  familyId: varchar('familyId', { length: 128 })
    .notNull()
    .references(() => Families.id, { onDelete: 'cascade' })
    .default(requestingFamilyId()),
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId({ prefix: 'celebration' })),
  metadata: json('metadata').$type<Record<string, unknown>>(),
  note: text('note'),
  photoUrls: json('photoUrls').$type<string[]>().default([]),
  sharedWith: json('sharedWith').$type<string[]>().default([]), // Array of user IDs
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  userId: varchar('userId', { length: 128 })
    .notNull()
    .default(requestingUserId()),
});

export const GrowthRecords = pgTable('growthRecords', {
  babyId: varchar('babyId', { length: 128 })
    .notNull()
    .references(() => Babies.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  date: timestamp('date', { mode: 'date' }).notNull(),
  familyId: varchar('familyId', { length: 128 })
    .notNull()
    .references(() => Families.id, { onDelete: 'cascade' })
    .default(requestingFamilyId()),
  headCircumference: integer('headCircumference'), // in cm
  height: integer('height'), // in cm
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId({ prefix: 'growth' })),
  metadata: json('metadata').$type<Record<string, unknown>>(),
  notes: text('notes'),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  userId: varchar('userId', { length: 128 })
    .notNull()
    .default(requestingUserId()),
  weight: integer('weight'), // in grams
});

// ============================================================================
// Tables - Feed Calculator
// ============================================================================

export const SupplyInventory = pgTable('supplyInventory', {
  babyId: varchar('babyId', { length: 128 })
    .notNull()
    .references(() => Babies.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  donorMl: integer('donorMl').default(0).notNull(), // Donor milk in ml
  familyId: varchar('familyId', { length: 128 })
    .notNull()
    .references(() => Families.id, { onDelete: 'cascade' })
    .default(requestingFamilyId()),
  formulaMl: integer('formulaMl').default(0).notNull(), // Formula in ml
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId({ prefix: 'inventory' })),
  pumpedMl: integer('pumpedMl').default(0).notNull(), // Pumped milk in ml
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  userId: varchar('userId', { length: 128 })
    .notNull()
    .default(requestingUserId()),
});

export const SupplyTransactions = pgTable('supplyTransactions', {
  amountMl: integer('amountMl').notNull(), // Amount in ml
  babyId: varchar('babyId', { length: 128 })
    .notNull()
    .references(() => Babies.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  familyId: varchar('familyId', { length: 128 })
    .notNull()
    .references(() => Families.id, { onDelete: 'cascade' })
    .default(requestingFamilyId()),
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId({ prefix: 'transaction' })),
  notes: text('notes'),
  source: feedingSourceEnum('source').notNull(), // pumped, donor, or formula
  timestamp: timestamp('timestamp', { mode: 'date' }).notNull().defaultNow(),
  type: supplyTransactionTypeEnum('type').notNull(), // add or deduct
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  userId: varchar('userId', { length: 128 })
    .notNull()
    .default(requestingUserId()),
});

// ============================================================================
// Tables - Content Cache
// ============================================================================

export const ContentCache = pgTable(
  'contentCache',
  {
    babyId: varchar('babyId', { length: 128 })
      .references(() => Babies.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expiresAt', {
      mode: 'date',
      withTimezone: true,
    }).notNull(),
    familyId: varchar('familyId', { length: 128 })
      .notNull()
      .references(() => Families.id, { onDelete: 'cascade' })
      .default(requestingFamilyId()),
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'cache' }))
      .notNull()
      .primaryKey(),
    key: text('key').notNull(),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      withTimezone: true,
    }).$onUpdateFn(() => new Date()),
    userId: varchar('userId', { length: 128 })
      .notNull()
      .default(requestingUserId()),
    value: json('value').$type<unknown>().notNull(),
  },
  (table) => [
    // Composite index for efficient baby + key lookups
    index('contentCache_babyId_key_idx').on(table.babyId, table.key),
    // Unique constraint to prevent duplicate baby+key combinations
    unique().on(table.babyId, table.key),
  ],
);

// ============================================================================
// Tables - AI Chat
// ============================================================================

export const Chats = pgTable(
  'chats',
  {
    babyId: varchar('babyId', { length: 128 })
      .notNull()
      .references(() => Babies.id, { onDelete: 'cascade' }),
    contextId: varchar('contextId', { length: 256 }), // Identifier for context (e.g., learning tip ID, milestone ID)
    contextType: varchar('contextType', { length: 64 }), // Type of context (e.g., 'learning_tip', 'milestone', 'general')
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    familyId: varchar('familyId', { length: 128 })
      .notNull()
      .references(() => Families.id, { onDelete: 'cascade' })
      .default(requestingFamilyId()),
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'chat' }))
      .notNull()
      .primaryKey(),
    summary: text('summary'), // AI-generated summary of chat (populated separately)
    title: text('title').notNull().default('New Chat'),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      withTimezone: true,
    }).$onUpdateFn(() => new Date()),
    userId: varchar('userId', { length: 128 })
      .notNull()
      .default(requestingUserId()),
  },
  (table) => [
    // Index for efficient baby + family lookups
    index('chats_babyId_familyId_idx').on(table.babyId, table.familyId),
    // Index for sorting by updated time
    index('chats_updatedAt_idx').on(table.updatedAt),
    // Index for context lookups
    index('chats_contextType_contextId_idx').on(
      table.contextType,
      table.contextId,
    ),
  ],
);

export const ChatMessages = pgTable(
  'chatMessages',
  {
    chatId: varchar('chatId', { length: 128 })
      .notNull()
      .references(() => Chats.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'msg' }))
      .notNull()
      .primaryKey(),
    role: messageRoleEnum('role').notNull(),
    userId: varchar('userId', { length: 128 }).references(() => Users.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    // Index for efficient chat message lookups
    index('chatMessages_chatId_createdAt_idx').on(
      table.chatId,
      table.createdAt,
    ),
  ],
);

export const MilestoneQuestionResponses = pgTable(
  'milestoneQuestionResponses',
  {
    answer: questionAnswerEnum('answer').notNull(),
    babyId: varchar('babyId', { length: 128 })
      .notNull()
      .references(() => Babies.id, { onDelete: 'cascade' }),
    chatId: varchar('chatId', { length: 128 }).references(() => Chats.id, {
      onDelete: 'set null',
    }),
    contextId: varchar('contextId', { length: 256 }).notNull(), // e.g., milestone ID, learning tip ID
    contextType: varchar('contextType', { length: 64 }).notNull(), // e.g., 'milestone', 'learning_tip'
    createdAt: timestamp('createdAt', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    familyId: varchar('familyId', { length: 128 })
      .notNull()
      .references(() => Families.id, { onDelete: 'cascade' })
      .default(requestingFamilyId()),
    id: varchar('id', { length: 128 })
      .$defaultFn(() => createId({ prefix: 'mqr' }))
      .notNull()
      .primaryKey(),
    question: text('question').notNull(),
    updatedAt: timestamp('updatedAt', {
      mode: 'date',
      withTimezone: true,
    }).$onUpdateFn(() => new Date()),
    userId: varchar('userId', { length: 128 })
      .notNull()
      .default(requestingUserId()),
  },
  (table) => [
    // Index for efficient lookups by context
    index('milestoneQuestionResponses_contextType_contextId_idx').on(
      table.contextType,
      table.contextId,
    ),
    // Index for baby + family lookups
    index('milestoneQuestionResponses_babyId_familyId_idx').on(
      table.babyId,
      table.familyId,
    ),
    // Index for user responses
    index('milestoneQuestionResponses_userId_createdAt_idx').on(
      table.userId,
      table.createdAt,
    ),
    // Unique constraint: one response per user per question per context
    unique('unique_response_per_context').on(
      table.userId,
      table.contextType,
      table.contextId,
      table.question,
    ),
  ],
);

// ============================================================================
// Relations
// ============================================================================

export const UsersRelations = relations(Users, ({ many }) => ({
  familyMembers: many(FamilyMembers),
  invitationsSent: many(Invitations, { relationName: 'invitedBy' }),
  invitationsUsed: many(Invitations, { relationName: 'usedBy' }),
}));

export const FamiliesRelations = relations(Families, ({ one, many }) => ({
  createdByUser: one(Users, {
    fields: [Families.createdByUserId],
    references: [Users.id],
  }),
  familyMembers: many(FamilyMembers),
  invitations: many(Invitations),
}));

export const FamilyMembersRelations = relations(FamilyMembers, ({ one }) => ({
  family: one(Families, {
    fields: [FamilyMembers.familyId],
    references: [Families.id],
  }),
  user: one(Users, {
    fields: [FamilyMembers.userId],
    references: [Users.id],
  }),
}));

export const ShortUrlsRelations = relations(ShortUrls, ({ one }) => ({
  family: one(Families, {
    fields: [ShortUrls.familyId],
    references: [Families.id],
  }),
  user: one(Users, {
    fields: [ShortUrls.userId],
    references: [Users.id],
  }),
}));

export const InvitationsRelations = relations(Invitations, ({ one }) => ({
  family: one(Families, {
    fields: [Invitations.familyId],
    references: [Families.id],
  }),
  invitedBy: one(Users, {
    fields: [Invitations.invitedByUserId],
    references: [Users.id],
    relationName: 'invitedBy',
  }),
  usedBy: one(Users, {
    fields: [Invitations.usedByUserId],
    references: [Users.id],
    relationName: 'usedBy',
  }),
}));

export const BabiesRelations = relations(Babies, ({ one, many }) => ({
  activities: many(Activities),
  chats: many(Chats),
  contentCache: many(ContentCache),
  family: one(Families, {
    fields: [Babies.familyId],
    references: [Families.id],
  }),
  growthRecords: many(GrowthRecords),
  medicalRecords: many(MedicalRecords),
  milestones: many(Milestones),
  supplyInventory: many(SupplyInventory),
  supplyTransactions: many(SupplyTransactions),
  user: one(Users, {
    fields: [Babies.userId],
    references: [Users.id],
  }),
}));

export const ActivitiesRelations = relations(Activities, ({ one }) => ({
  baby: one(Babies, {
    fields: [Activities.babyId],
    references: [Babies.id],
  }),
  family: one(Families, {
    fields: [Activities.familyId],
    references: [Families.id],
  }),
  user: one(Users, {
    fields: [Activities.userId],
    references: [Users.id],
  }),
}));

export const MedicalRecordsRelations = relations(MedicalRecords, ({ one }) => ({
  baby: one(Babies, {
    fields: [MedicalRecords.babyId],
    references: [Babies.id],
  }),
  family: one(Families, {
    fields: [MedicalRecords.familyId],
    references: [Families.id],
  }),
  user: one(Users, {
    fields: [MedicalRecords.userId],
    references: [Users.id],
  }),
}));

export const MilestonesRelations = relations(Milestones, ({ one }) => ({
  baby: one(Babies, {
    fields: [Milestones.babyId],
    references: [Babies.id],
  }),
  family: one(Families, {
    fields: [Milestones.familyId],
    references: [Families.id],
  }),
  user: one(Users, {
    fields: [Milestones.userId],
    references: [Users.id],
  }),
}));

export const CelebrationMemoriesRelations = relations(
  CelebrationMemories,
  ({ one }) => ({
    baby: one(Babies, {
      fields: [CelebrationMemories.babyId],
      references: [Babies.id],
    }),
    family: one(Families, {
      fields: [CelebrationMemories.familyId],
      references: [Families.id],
    }),
    user: one(Users, {
      fields: [CelebrationMemories.userId],
      references: [Users.id],
    }),
  }),
);

export const GrowthRecordsRelations = relations(GrowthRecords, ({ one }) => ({
  baby: one(Babies, {
    fields: [GrowthRecords.babyId],
    references: [Babies.id],
  }),
  family: one(Families, {
    fields: [GrowthRecords.familyId],
    references: [Families.id],
  }),
  user: one(Users, {
    fields: [GrowthRecords.userId],
    references: [Users.id],
  }),
}));

export const SupplyInventoryRelations = relations(
  SupplyInventory,
  ({ one }) => ({
    baby: one(Babies, {
      fields: [SupplyInventory.babyId],
      references: [Babies.id],
    }),
    family: one(Families, {
      fields: [SupplyInventory.familyId],
      references: [Families.id],
    }),
    user: one(Users, {
      fields: [SupplyInventory.userId],
      references: [Users.id],
    }),
  }),
);

export const SupplyTransactionsRelations = relations(
  SupplyTransactions,
  ({ one }) => ({
    baby: one(Babies, {
      fields: [SupplyTransactions.babyId],
      references: [Babies.id],
    }),
    family: one(Families, {
      fields: [SupplyTransactions.familyId],
      references: [Families.id],
    }),
    user: one(Users, {
      fields: [SupplyTransactions.userId],
      references: [Users.id],
    }),
  }),
);

export const ContentCacheRelations = relations(ContentCache, ({ one }) => ({
  baby: one(Babies, {
    fields: [ContentCache.babyId],
    references: [Babies.id],
  }),
  family: one(Families, {
    fields: [ContentCache.familyId],
    references: [Families.id],
  }),
  user: one(Users, {
    fields: [ContentCache.userId],
    references: [Users.id],
  }),
}));

export const ChatsRelations = relations(Chats, ({ one, many }) => ({
  baby: one(Babies, {
    fields: [Chats.babyId],
    references: [Babies.id],
  }),
  family: one(Families, {
    fields: [Chats.familyId],
    references: [Families.id],
  }),
  messages: many(ChatMessages),
  milestoneQuestionResponses: many(MilestoneQuestionResponses),
  user: one(Users, {
    fields: [Chats.userId],
    references: [Users.id],
  }),
}));

export const ChatMessagesRelations = relations(ChatMessages, ({ one }) => ({
  chat: one(Chats, {
    fields: [ChatMessages.chatId],
    references: [Chats.id],
  }),
  user: one(Users, {
    fields: [ChatMessages.userId],
    references: [Users.id],
  }),
}));

export const MilestoneQuestionResponsesRelations = relations(
  MilestoneQuestionResponses,
  ({ one }) => ({
    baby: one(Babies, {
      fields: [MilestoneQuestionResponses.babyId],
      references: [Babies.id],
    }),
    chat: one(Chats, {
      fields: [MilestoneQuestionResponses.chatId],
      references: [Chats.id],
    }),
    family: one(Families, {
      fields: [MilestoneQuestionResponses.familyId],
      references: [Families.id],
    }),
    user: one(Users, {
      fields: [MilestoneQuestionResponses.userId],
      references: [Users.id],
    }),
  }),
);

// ============================================================================
// Types
// ============================================================================

export type UserType = typeof Users.$inferSelect;
export type FamilyType = typeof Families.$inferSelect;
export type FamilyMemberType = typeof FamilyMembers.$inferSelect & {
  user?: UserType;
  family?: FamilyType;
};
export type ShortUrlType = typeof ShortUrls.$inferSelect;
export type InvitationType = typeof Invitations.$inferSelect & {
  invitedBy?: UserType;
  usedBy?: UserType;
  family?: FamilyType;
};
export type NewInvitation = typeof Invitations.$inferInsert;

export type Baby = typeof Babies.$inferSelect;
export type NewBaby = typeof Babies.$inferInsert;
export type Activity = typeof Activities.$inferSelect;
export type NewActivity = typeof Activities.$inferInsert;
export type MedicalRecord = typeof MedicalRecords.$inferSelect;
export type NewMedicalRecord = typeof MedicalRecords.$inferInsert;
export type Milestone = typeof Milestones.$inferSelect;
export type NewMilestone = typeof Milestones.$inferInsert;
export type GrowthRecord = typeof GrowthRecords.$inferSelect;
export type NewGrowthRecord = typeof GrowthRecords.$inferInsert;
export type SupplyInventoryType = typeof SupplyInventory.$inferSelect;
export type NewSupplyInventory = typeof SupplyInventory.$inferInsert;
export type SupplyTransaction = typeof SupplyTransactions.$inferSelect;
export type NewSupplyTransaction = typeof SupplyTransactions.$inferInsert;
export type ContentCacheType = typeof ContentCache.$inferSelect;
export type NewContentCache = typeof ContentCache.$inferInsert;
export type Chat = typeof Chats.$inferSelect;
export type NewChat = typeof Chats.$inferInsert;
export type ChatMessage = typeof ChatMessages.$inferSelect;
export type NewChatMessage = typeof ChatMessages.$inferInsert;

// ============================================================================
// Zod Schemas
// ============================================================================

export const CreateUserSchema = createInsertSchema(Users).omit({
  createdAt: true,
  id: true,
  updatedAt: true,
});

export const updateFamilySchema = createInsertSchema(Families).omit({
  createdAt: true,
  createdByUserId: true,
  id: true,
  updatedAt: true,
});

export const CreateShortUrlSchema = createInsertSchema(ShortUrls).omit({
  createdAt: true,
  familyId: true,
  id: true,
  updatedAt: true,
  userId: true,
});

export const UpdateShortUrlSchema = createUpdateSchema(ShortUrls).omit({
  createdAt: true,
  familyId: true,
  id: true,
  updatedAt: true,
  userId: true,
});

export const insertInvitationSchema = createInsertSchema(Invitations).omit({
  createdAt: true,
  familyId: true,
  id: true,
  invitedByUserId: true,
  updatedAt: true,
});
export const selectInvitationSchema = createSelectSchema(Invitations);
export const updateInvitationSchema = createUpdateSchema(Invitations).omit({
  createdAt: true,
  familyId: true,
  id: true,
  invitedByUserId: true,
  updatedAt: true,
});

export const insertBabySchema = createInsertSchema(Babies);
export const selectBabySchema = createSelectSchema(Babies);
export const updateBabySchema = insertBabySchema.partial();

export const insertActivitySchema = createInsertSchema(Activities).extend({
  details: activityDetailsSchema,
});
export const selectActivitySchema = createSelectSchema(Activities).extend({
  details: activityDetailsSchema,
});
export const updateActivitySchema = insertActivitySchema.partial();

export const insertMedicalRecordSchema = createInsertSchema(MedicalRecords);
export const selectMedicalRecordSchema = createSelectSchema(MedicalRecords);
export const updateMedicalRecordSchema = insertMedicalRecordSchema.partial();

export const insertMilestoneSchema = createInsertSchema(Milestones);
export const selectMilestoneSchema = createSelectSchema(Milestones);
export const updateMilestoneSchema = insertMilestoneSchema.partial();

export const insertCelebrationMemorySchema = createInsertSchema(
  CelebrationMemories,
).omit({
  createdAt: true,
  familyId: true,
  id: true,
  updatedAt: true,
});
export const selectCelebrationMemorySchema =
  createSelectSchema(CelebrationMemories);
export const updateCelebrationMemorySchema =
  insertCelebrationMemorySchema.partial();

export const insertGrowthRecordSchema = createInsertSchema(GrowthRecords);
export const selectGrowthRecordSchema = createSelectSchema(GrowthRecords);
export const updateGrowthRecordSchema = insertGrowthRecordSchema.partial();

export const insertSupplyInventorySchema = createInsertSchema(SupplyInventory);
export const selectSupplyInventorySchema = createSelectSchema(SupplyInventory);
export const updateSupplyInventorySchema =
  insertSupplyInventorySchema.partial();

export const insertSupplyTransactionSchema =
  createInsertSchema(SupplyTransactions);
export const selectSupplyTransactionSchema =
  createSelectSchema(SupplyTransactions);
export const updateSupplyTransactionSchema =
  insertSupplyTransactionSchema.partial();

export const insertFamilyMemberSchema = createInsertSchema(FamilyMembers);
export const selectFamilyMemberSchema = createSelectSchema(FamilyMembers);
export const updateFamilyMemberSchema = insertFamilyMemberSchema.partial();

export const insertContentCacheSchema = createInsertSchema(ContentCache);
export const selectContentCacheSchema = createSelectSchema(ContentCache);
export const updateContentCacheSchema = insertContentCacheSchema.partial();

export const insertChatSchema = createInsertSchema(Chats).omit({
  createdAt: true,
  familyId: true,
  id: true,
  updatedAt: true,
  userId: true,
});
export const selectChatSchema = createSelectSchema(Chats);
export const updateChatSchema = createUpdateSchema(Chats).omit({
  createdAt: true,
  familyId: true,
  id: true,
  userId: true,
});

export const insertChatMessageSchema = createInsertSchema(ChatMessages).omit({
  createdAt: true,
  id: true,
});
export const selectChatMessageSchema = createSelectSchema(ChatMessages);

export const insertMilestoneQuestionResponseSchema = createInsertSchema(
  MilestoneQuestionResponses,
).omit({
  createdAt: true,
  familyId: true,
  id: true,
  updatedAt: true,
  userId: true,
});
export const selectMilestoneQuestionResponseSchema = createSelectSchema(
  MilestoneQuestionResponses,
);
export const updateMilestoneQuestionResponseSchema = createUpdateSchema(
  MilestoneQuestionResponses,
).omit({
  createdAt: true,
  familyId: true,
  id: true,
  userId: true,
});

// ============================================================================
// Tables - Parent Wellness & Support
// ============================================================================

// Parent Check-Ins - Daily wellness check-ins for parents
export const ParentCheckIns = pgTable(
  'parentCheckIns',
  {
    aiGeneratedQuestions: boolean('aiGeneratedQuestions').default(true),
    concernsRaised: json('concernsRaised').$type<string[]>().default([]),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    date: timestamp('date', { mode: 'date' }).notNull().defaultNow(),
    familyId: varchar('familyId', { length: 128 })
      .notNull()
      .references(() => Families.id, { onDelete: 'cascade' })
      .default(requestingFamilyId()),
    id: varchar('id', { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId({ prefix: 'checkin' })),
    moodScore: integer('moodScore'), // 1-5 scale
    questionContext: json('questionContext').$type<{
      ppDay?: number;
      parentRole?: string;
      parentSleepHours?: number;
      babyAgeInDays?: number;
    }>(),
    responses: json('responses')
      .$type<
        Array<{
          questionId: string;
          question: string;
          response: string | number | boolean;
          responseType: 'emoji_scale' | 'yes_no' | 'rating_1_5' | 'text_short';
          category:
            | 'physical'
            | 'emotional'
            | 'support'
            | 'baby_concern'
            | 'self_care';
        }>
      >()
      .notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    userId: varchar('userId', { length: 128 })
      .notNull()
      .references(() => Users.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    dateIdx: index('parentCheckIns_date_idx').on(table.date),
    familyIdx: index('parentCheckIns_family_idx').on(table.familyId),
    userIdx: index('parentCheckIns_user_idx').on(table.userId),
  }),
);

// Parent Tasks - Personalized daily tasks for parents
export const ParentTasks = pgTable(
  'parentTasks',
  {
    category: taskCategoryEnum('category').notNull(),
    completed: boolean('completed').default(false).notNull(),
    completedAt: timestamp('completedAt', { mode: 'date' }),
    context: json('context').$type<{
      babyAgeInDays?: number;
      ppWeek?: number;
      timeOfDay?: string;
      feedingMethod?: string;
    }>(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    estimatedMinutes: integer('estimatedMinutes'),
    familyId: varchar('familyId', { length: 128 })
      .notNull()
      .references(() => Families.id, { onDelete: 'cascade' })
      .default(requestingFamilyId()),
    generatedDate: timestamp('generatedDate', { mode: 'date' })
      .notNull()
      .defaultNow(),
    id: varchar('id', { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId({ prefix: 'task' })),
    priority: taskPriorityEnum('priority').notNull().default('medium'),
    suggestedTime: varchar('suggestedTime', { length: 64 }), // morning, afternoon, evening, anytime
    taskText: text('taskText').notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    userId: varchar('userId', { length: 128 })
      .notNull()
      .references(() => Users.id, { onDelete: 'cascade' }),
    whyItMatters: text('whyItMatters'), // Explanation of importance
  },
  (table) => ({
    completedIdx: index('parentTasks_completed_idx').on(table.completed),
    familyIdx: index('parentTasks_family_idx').on(table.familyId),
    generatedDateIdx: index('parentTasks_generated_date_idx').on(
      table.generatedDate,
    ),
    userIdx: index('parentTasks_user_idx').on(table.userId),
  }),
);

// Wellness Assessments - Mental health screening assessments
export const WellnessAssessments = pgTable(
  'wellnessAssessments',
  {
    assessmentType: varchar('assessmentType', { length: 64 }).notNull(), // routine, triggered, self_initiated
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    date: timestamp('date', { mode: 'date' }).notNull().defaultNow(),
    familyId: varchar('familyId', { length: 128 })
      .notNull()
      .references(() => Families.id, { onDelete: 'cascade' })
      .default(requestingFamilyId()),
    followUpScheduled: timestamp('followUpScheduled', { mode: 'date' }),
    id: varchar('id', { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId({ prefix: 'wellness' })),
    notes: text('notes'),
    questions: json('questions')
      .$type<
        Array<{
          question: string;
          responseType: string;
          category: string;
          weight: number;
          reverseScore: boolean;
        }>
      >()
      .notNull(),
    recommendations: json('recommendations').$type<string[]>(),
    responses: json('responses')
      .$type<
        Array<{
          questionId: number;
          response: number | string;
        }>
      >()
      .notNull(),
    riskScore: integer('riskScore'), // Calculated score (e.g., EPDS score)
    updatedAt: timestamp('updatedAt', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    userId: varchar('userId', { length: 128 })
      .notNull()
      .references(() => Users.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    dateIdx: index('wellnessAssessments_date_idx').on(table.date),
    familyIdx: index('wellnessAssessments_family_idx').on(table.familyId),
    riskScoreIdx: index('wellnessAssessments_risk_score_idx').on(
      table.riskScore,
    ),
    userIdx: index('wellnessAssessments_user_idx').on(table.userId),
  }),
);

// ============================================================================
// Relations - Parent Wellness & Support
// ============================================================================

export const ParentCheckInsRelations = relations(ParentCheckIns, ({ one }) => ({
  family: one(Families, {
    fields: [ParentCheckIns.familyId],
    references: [Families.id],
  }),
  user: one(Users, {
    fields: [ParentCheckIns.userId],
    references: [Users.id],
  }),
}));

export const ParentTasksRelations = relations(ParentTasks, ({ one }) => ({
  family: one(Families, {
    fields: [ParentTasks.familyId],
    references: [Families.id],
  }),
  user: one(Users, {
    fields: [ParentTasks.userId],
    references: [Users.id],
  }),
}));

export const WellnessAssessmentsRelations = relations(
  WellnessAssessments,
  ({ one }) => ({
    family: one(Families, {
      fields: [WellnessAssessments.familyId],
      references: [Families.id],
    }),
    user: one(Users, {
      fields: [WellnessAssessments.userId],
      references: [Users.id],
    }),
  }),
);

// ============================================================================
// Zod Schemas - Parent Wellness & Support
// ============================================================================

export const insertParentCheckInSchema = createInsertSchema(
  ParentCheckIns,
).omit({
  createdAt: true,
  familyId: true,
  id: true,
  updatedAt: true,
});
export const selectParentCheckInSchema = createSelectSchema(ParentCheckIns);
export const updateParentCheckInSchema = insertParentCheckInSchema.partial();

export const insertParentTaskSchema = createInsertSchema(ParentTasks).omit({
  createdAt: true,
  familyId: true,
  id: true,
  updatedAt: true,
});
export const selectParentTaskSchema = createSelectSchema(ParentTasks);
export const updateParentTaskSchema = insertParentTaskSchema.partial();

export const insertWellnessAssessmentSchema = createInsertSchema(
  WellnessAssessments,
).omit({
  createdAt: true,
  familyId: true,
  id: true,
  updatedAt: true,
});
export const selectWellnessAssessmentSchema =
  createSelectSchema(WellnessAssessments);
export const updateWellnessAssessmentSchema =
  insertWellnessAssessmentSchema.partial();

// ============================================================================
// Backward compatibility exports (deprecated - use Families/FamilyMembers)
// ============================================================================
