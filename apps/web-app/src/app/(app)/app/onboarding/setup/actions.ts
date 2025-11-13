'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@nugget/db/client';
import { Babies, FamilyMembers } from '@nugget/db/schema';
import { eq } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';

// Create the action client
const action = createSafeActionClient();

// Get setup status
export const getSetupStatus = action.action(async () => {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Get baby data if family exists
  let babies: (typeof Babies.$inferSelect)[] = [];
  if (orgId) {
    babies = await db.query.Babies.findMany({
      where: eq(Babies.familyId, orgId),
    });
  }

  // Get family member data
  let familyMember = null;
  if (orgId) {
    familyMember = await db.query.FamilyMembers.findFirst({
      where: eq(FamilyMembers.userId, userId),
    });
  }

  return {
    babies,
    familyMember,
    hasBabies: babies.length > 0,
    hasFamilyMember: Boolean(familyMember),
    journeyStage: familyMember?.journeyStage,
  };
});
