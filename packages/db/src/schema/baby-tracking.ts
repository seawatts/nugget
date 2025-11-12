import { createId } from '@nugget/id';
import { relations, sql } from 'drizzle-orm';
import {
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Helper function to get user ID from Clerk JWT
const requestingUserId = () => sql`requesting_user_id()`;

// Enums for baby tracking
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

export const ActivityTypeType = z.enum(activityTypeEnum.enumValues).enum;
export const MilestoneTypeType = z.enum(milestoneTypeEnum.enumValues).enum;

// Baby Profiles Table
export const BabyProfiles = pgTable('baby_profile', {
  birthDate: timestamp('birthDate', { mode: 'date' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  dueDate: timestamp('dueDate', { mode: 'date' }),
  gender: text('gender'),
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  metadata: json('metadata').$type<Record<string, unknown>>(),
  name: text('name').notNull(),
  photoUrl: text('photoUrl'),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  userId: text('userId').notNull().default(requestingUserId()),
});

export const BabyProfilesRelations = relations(BabyProfiles, ({ many }) => ({
  activities: many(Activities),
  growthRecords: many(GrowthRecords),
  medicalRecords: many(MedicalRecords),
  milestones: many(Milestones),
}));

// Activities Table
export const Activities = pgTable('activity', {
  amount: integer('amount'), // for feeding, could be ml or oz
  babyId: varchar('babyId')
    .notNull()
    .references(() => BabyProfiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  duration: integer('duration'), // in minutes
  endTime: timestamp('endTime', { mode: 'date' }),
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  metadata: json('metadata').$type<Record<string, unknown>>(),
  notes: text('notes'),
  startTime: timestamp('startTime', { mode: 'date' }).notNull(),
  type: activityTypeEnum('type').notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  userId: text('userId').notNull().default(requestingUserId()),
});

export const ActivitiesRelations = relations(Activities, ({ one }) => ({
  baby: one(BabyProfiles, {
    fields: [Activities.babyId],
    references: [BabyProfiles.id],
  }),
}));

// Medical Records Table
export const MedicalRecords = pgTable('medical_record', {
  babyId: varchar('babyId')
    .notNull()
    .references(() => BabyProfiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  date: timestamp('date', { mode: 'date' }).notNull(),
  description: text('description'),
  id: varchar('id')
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
  userId: text('userId').notNull().default(requestingUserId()),
});

export const MedicalRecordsRelations = relations(MedicalRecords, ({ one }) => ({
  baby: one(BabyProfiles, {
    fields: [MedicalRecords.babyId],
    references: [BabyProfiles.id],
  }),
}));

// Milestones Table
export const Milestones = pgTable('milestone', {
  achievedDate: timestamp('achievedDate', { mode: 'date' }).notNull(),
  babyId: varchar('babyId')
    .notNull()
    .references(() => BabyProfiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  description: text('description'),
  id: varchar('id')
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
  userId: text('userId').notNull().default(requestingUserId()),
});

export const MilestonesRelations = relations(Milestones, ({ one }) => ({
  baby: one(BabyProfiles, {
    fields: [Milestones.babyId],
    references: [BabyProfiles.id],
  }),
}));

// Growth Records Table
export const GrowthRecords = pgTable('growth_record', {
  babyId: varchar('babyId')
    .notNull()
    .references(() => BabyProfiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  date: timestamp('date', { mode: 'date' }).notNull(),
  headCircumference: integer('headCircumference'), // in cm
  height: integer('height'), // in cm
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  metadata: json('metadata').$type<Record<string, unknown>>(),
  notes: text('notes'),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  userId: text('userId').notNull().default(requestingUserId()),
  weight: integer('weight'), // in grams
});

export const GrowthRecordsRelations = relations(GrowthRecords, ({ one }) => ({
  baby: one(BabyProfiles, {
    fields: [GrowthRecords.babyId],
    references: [BabyProfiles.id],
  }),
}));

// Zod schemas for validation
export const insertBabyProfileSchema = createInsertSchema(BabyProfiles);
export const selectBabyProfileSchema = createSelectSchema(BabyProfiles);
export const updateBabyProfileSchema = insertBabyProfileSchema.partial();

export const insertActivitySchema = createInsertSchema(Activities);
export const selectActivitySchema = createSelectSchema(Activities);
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

// Type exports
export type BabyProfile = typeof BabyProfiles.$inferSelect;
export type NewBabyProfile = typeof BabyProfiles.$inferInsert;

export type Activity = typeof Activities.$inferSelect;
export type NewActivity = typeof Activities.$inferInsert;

export type MedicalRecord = typeof MedicalRecords.$inferSelect;
export type NewMedicalRecord = typeof MedicalRecords.$inferInsert;

export type Milestone = typeof Milestones.$inferSelect;
export type NewMilestone = typeof Milestones.$inferInsert;

export type GrowthRecord = typeof GrowthRecords.$inferSelect;
export type NewGrowthRecord = typeof GrowthRecords.$inferInsert;
