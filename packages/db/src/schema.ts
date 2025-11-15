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
export const milestoneTypeEnum = pgEnum('milestoneType', [
  'physical',
  'cognitive',
  'social',
  'language',
  'self_care',
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
export const temperatureUnitEnum = pgEnum('temperatureUnit', [
  'fahrenheit',
  'celsius',
]);
export const timeFormatEnum = pgEnum('timeFormat', ['12h', '24h']);
export const themeEnum = pgEnum('theme', ['light', 'dark', 'system']);

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
  unitPref: unitPrefEnum('unitPref').default('ML').notNull(), // User's preferred unit for display
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
});

// Diaper details
export const diaperDetailsSchema = z.object({
  color: z
    .enum(['yellow', 'brown', 'green', 'black', 'red', 'white', 'orange'])
    .optional(),
  consistency: z
    .enum(['liquid', 'soft', 'firm', 'hard', 'seedy', 'mucus'])
    .optional(),
});

// Medicine details
export const medicineDetailsSchema = z.object({
  dosage: z.string(),
  name: z.string(),
});

// Pumping details (separate amounts for each breast)
export const pumpingDetailsSchema = z.object({
  leftBreastMl: z.number().optional(),
  rightBreastMl: z.number().optional(),
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

// ============================================================================
// Tables - Baby Tracking
// ============================================================================

export const Babies = pgTable('babies', {
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
  babyId: varchar('babyId', { length: 128 })
    .notNull()
    .references(() => Babies.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  details: json('details').$type<ActivityDetails>(),
  duration: integer('duration'), // in minutes
  endTime: timestamp('endTime', { mode: 'date' }),
  familyId: varchar('familyId', { length: 128 })
    .notNull()
    .references(() => Families.id, { onDelete: 'cascade' })
    .default(requestingFamilyId()),
  feedingSource: feedingSourceEnum('feedingSource'), // Source of milk/formula for feeding activities
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId({ prefix: 'activity' })),
  isScheduled: boolean('isScheduled').default(false).notNull(), // Whether this is a scheduled/future feed
  notes: text('notes'),
  startTime: timestamp('startTime', { mode: 'date' }).notNull(),
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
  achievedDate: timestamp('achievedDate', { mode: 'date' }).notNull(),
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
  metadata: json('metadata').$type<Record<string, unknown>>(),
  photoUrl: text('photoUrl'),
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

// ============================================================================
// Backward compatibility exports (deprecated - use Families/FamilyMembers)
// ============================================================================
