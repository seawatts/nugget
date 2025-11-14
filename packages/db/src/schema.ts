import { createId } from '@nugget/id';
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
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
  online: boolean('online').default(false).notNull(),
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
  (table) => [unique().on(table.userId, table.familyId)],
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
    .$defaultFn(() => createId()),
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
  babyId: varchar('babyId', { length: 128 })
    .notNull()
    .references(() => Babies.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  details: json('details').$type<ActivityDetails>(),
  duration: integer('duration'), // in minutes
  endTime: timestamp('endTime', { mode: 'date' }),
  familyMemberId: varchar('familyMemberId', { length: 128 }).references(
    () => FamilyMembers.id,
    { onDelete: 'set null' },
  ), // FamilyMember who performed/assigned the activity
  feedingSource: feedingSourceEnum('feedingSource'), // Source of milk/formula for feeding activities
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
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
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
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
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
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
  headCircumference: integer('headCircumference'), // in cm
  height: integer('height'), // in cm
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
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
  formulaMl: integer('formulaMl').default(0).notNull(), // Formula in ml
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
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
  familyMemberId: varchar('familyMemberId', { length: 128 }).references(
    () => FamilyMembers.id,
    { onDelete: 'set null' },
  ), // Who made the transaction
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
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
// Relations
// ============================================================================

export const UsersRelations = relations(Users, ({ many }) => ({
  familyMembers: many(FamilyMembers),
}));

export const FamiliesRelations = relations(Families, ({ one, many }) => ({
  createdByUser: one(Users, {
    fields: [Families.createdByUserId],
    references: [Users.id],
  }),
  familyMembers: many(FamilyMembers),
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

export const BabiesRelations = relations(Babies, ({ one, many }) => ({
  activities: many(Activities),
  family: one(Families, {
    fields: [Babies.familyId],
    references: [Families.id],
  }),
  growthRecords: many(GrowthRecords),
  medicalRecords: many(MedicalRecords),
  milestones: many(Milestones),
  supplyInventory: many(SupplyInventory),
  supplyTransactions: many(SupplyTransactions),
}));

export const ActivitiesRelations = relations(Activities, ({ one }) => ({
  baby: one(Babies, {
    fields: [Activities.babyId],
    references: [Babies.id],
  }),
  familyMember: one(FamilyMembers, {
    fields: [Activities.familyMemberId],
    references: [FamilyMembers.id],
  }),
}));

export const MedicalRecordsRelations = relations(MedicalRecords, ({ one }) => ({
  baby: one(Babies, {
    fields: [MedicalRecords.babyId],
    references: [Babies.id],
  }),
}));

export const MilestonesRelations = relations(Milestones, ({ one }) => ({
  baby: one(Babies, {
    fields: [Milestones.babyId],
    references: [Babies.id],
  }),
}));

export const GrowthRecordsRelations = relations(GrowthRecords, ({ one }) => ({
  baby: one(Babies, {
    fields: [GrowthRecords.babyId],
    references: [Babies.id],
  }),
}));

export const SupplyInventoryRelations = relations(
  SupplyInventory,
  ({ one }) => ({
    baby: one(Babies, {
      fields: [SupplyInventory.babyId],
      references: [Babies.id],
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
    familyMember: one(FamilyMembers, {
      fields: [SupplyTransactions.familyMemberId],
      references: [FamilyMembers.id],
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

// ============================================================================
// Backward compatibility exports (deprecated - use Families/FamilyMembers)
// ============================================================================
/** @deprecated Use Families instead */
export const Orgs = Families;
/** @deprecated Use FamilyMembers instead */
export const OrgMembers = FamilyMembers;
/** @deprecated Use FamilyType instead */
export type OrgType = FamilyType;
/** @deprecated Use FamilyMemberType instead */
export type OrgMembersType = FamilyMemberType;
