'use server';

import { createCaller, createTRPCContext } from '@nugget/api';
import { createSafeActionClient } from 'next-safe-action';

const action = createSafeActionClient();

export interface FamilyTabMember {
  id: string;
  userId: string;
  firstName: string;
  avatarUrl: string | null;
  type: 'baby' | 'user';
  isCurrentUser?: boolean;
}

/**
 * Fetch all family members and babies for display in tabs
 */
export const getFamilyTabsDataAction = action.action(async () => {
  const ctx = await createTRPCContext();
  const caller = createCaller(ctx);

  // Get all babies
  const babies = await caller.babies.list();

  // Get all family members
  const members = await caller.familyMembers.all();

  // Get current user to ensure they're included
  const currentUser = await caller.user.current();

  const tabs: FamilyTabMember[] = [];

  // Add babies first
  for (const baby of babies) {
    tabs.push({
      avatarUrl: baby.photoUrl,
      firstName: baby.firstName,
      id: baby.id,
      type: 'baby',
      userId: baby.id,
    });
  }

  // Add family members
  for (const member of members) {
    const isCurrentUser = member.userId === ctx.auth?.userId;
    tabs.push({
      avatarUrl: member.user?.avatarUrl || null,
      firstName: member.user?.firstName || member.user?.email || 'Unknown',
      id: member.id,
      isCurrentUser,
      type: 'user',
      userId: member.userId,
    });
  }

  // If current user is not in the list, add them
  if (currentUser && !tabs.some((t) => t.userId === currentUser.id)) {
    tabs.push({
      avatarUrl: currentUser.avatarUrl || null,
      firstName: currentUser.firstName || currentUser.email || 'Unknown',
      id: currentUser.id,
      isCurrentUser: true,
      type: 'user',
      userId: currentUser.id,
    });
  }

  return tabs;
});
