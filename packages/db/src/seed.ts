import { subDays } from 'date-fns';
import { seed } from 'drizzle-seed';

import { db } from './client';
import {
  Activities,
  Babies,
  Families,
  FamilyMembers,
  GrowthRecords,
  MedicalRecords,
  Milestones,
  ShortUrls,
  Users,
} from './schema';

// Reset all tables

await db.delete(GrowthRecords);
await db.delete(Milestones);
await db.delete(MedicalRecords);
await db.delete(Activities);
await db.delete(Babies);
await db.delete(ShortUrls);
await db.delete(FamilyMembers);
await db.delete(Families);
await db.delete(Users);

const userId = 'user_30oVYOGDYUTdXqB6HImz3XbRyTs';
const orgId = 'org_30oVYhhebEP3q4dSFlxo8DyAxhr';
const orgName = 'nugget';
const stripeCustomerId = 'cus_Snv28tYxHudPzx';
const stripeSubscriptionId = 'sub_1RsJCH4hM6DbRRtOGcENjqIO';

await seed(db, {
  Activities,
  Babies,
  Families,
  FamilyMembers,
  GrowthRecords,
  MedicalRecords,
  Milestones,
  ShortUrls,
  Users,
}).refine((funcs) => ({
  Activities: {
    columns: {
      startTime: funcs.date({
        maxDate: new Date(),
        minDate: subDays(new Date(), 30),
      }),
      type: funcs.valuesFromArray({
        values: ['sleep', 'feeding', 'bottle', 'diaper', 'bath'],
      }),
      userId: funcs.default({ defaultValue: userId }),
    },
    count: 10,
  },
  Babies: {
    columns: {
      name: funcs.default({ defaultValue: 'Baby Test' }),
      userId: funcs.default({ defaultValue: userId }),
    },
    count: 1,
  },
  Families: {
    columns: {
      clerkOrgId: funcs.default({
        defaultValue: orgId,
      }),
      id: funcs.default({ defaultValue: orgId }),
      name: funcs.default({ defaultValue: orgName }),
      stripeCustomerId: funcs.default({ defaultValue: stripeCustomerId }),
      stripeSubscriptionId: funcs.default({
        defaultValue: stripeSubscriptionId,
      }),
      stripeSubscriptionStatus: funcs.default({
        defaultValue: 'active',
      }),
    },
    count: 1,
  },
  FamilyMembers: {
    columns: {
      orgId: funcs.default({ defaultValue: orgId }),
      userId: funcs.default({
        defaultValue: userId,
      }),
    },
    count: 1,
  },
  GrowthRecords: {
    columns: {
      date: funcs.date({
        maxDate: new Date(),
        minDate: subDays(new Date(), 365),
      }),
      userId: funcs.default({ defaultValue: userId }),
    },
    count: 5,
  },
  MedicalRecords: {
    columns: {
      date: funcs.date({
        maxDate: new Date(),
        minDate: subDays(new Date(), 365),
      }),
      title: funcs.default({ defaultValue: 'Medical Record' }),
      type: funcs.valuesFromArray({
        values: ['vaccination', 'appointment', 'medication', 'illness'],
      }),
      userId: funcs.default({ defaultValue: userId }),
    },
    count: 5,
  },
  Milestones: {
    columns: {
      achievedDate: funcs.date({
        maxDate: new Date(),
        minDate: subDays(new Date(), 365),
      }),
      title: funcs.default({ defaultValue: 'Milestone' }),
      type: funcs.valuesFromArray({
        values: ['physical', 'cognitive', 'social', 'language', 'self_care'],
      }),
      userId: funcs.default({ defaultValue: userId }),
    },
    count: 5,
  },
  ShortUrls: {
    columns: {
      code: funcs.default({ defaultValue: 'test-code' }),
      orgId: funcs.default({ defaultValue: orgId }),
      redirectUrl: funcs.default({ defaultValue: 'https://example.com' }),
      userId: funcs.default({ defaultValue: userId }),
    },
    count: 3,
  },
  Users: {
    columns: {
      clerkId: funcs.default({
        defaultValue: userId,
      }),
      email: funcs.default({ defaultValue: 'chris.watts.t@gmail.com' }),
      firstName: funcs.default({ defaultValue: 'Chris' }),
      id: funcs.default({ defaultValue: userId }),
      lastName: funcs.default({ defaultValue: 'Watts' }),
      online: funcs.boolean(),
    },
    count: 1,
  },
}));

process.exit(0);
