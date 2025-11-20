'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import { createSafeActionClient } from 'next-safe-action';

const action = createSafeActionClient();

export interface FamilyTabMember {
  id: string;
  userId: string;
  firstName: string;
  avatarUrl: string | null;
  avatarBackgroundColor?: string | null;
  type: 'baby' | 'user';
  isCurrentUser?: boolean;
  role?: 'primary' | 'partner' | 'caregiver' | null;
  birthDate?: Date | null;
  dueDate?: Date | null;
}

/**
 * Fetch all family members and babies for display in tabs
 */
export const getFamilyTabsDataAction = action.action(async () => {
  const api = await getApi();
  const authResult = await auth();

  // Get all babies
  const babies = await api.babies.list();

  // Get all family members
  const members = await api.familyMembers.all();

  // Get current user to ensure they're included
  const currentUser = await api.user.current();

  const tabs: FamilyTabMember[] = [];

  // Add babies first
  for (const baby of babies) {
    tabs.push({
      avatarBackgroundColor: baby.avatarBackgroundColor,
      avatarUrl: baby.photoUrl,
      birthDate: baby.birthDate,
      dueDate: baby.dueDate,
      firstName: baby.firstName,
      id: baby.id,
      type: 'baby',
      userId: baby.id,
    });
  }

  // Add family members
  for (const member of members) {
    const isCurrentUser = member.userId === authResult?.userId;
    tabs.push({
      avatarUrl: member.user?.avatarUrl || null,
      firstName: member.user?.firstName || member.user?.email || 'Unknown',
      id: member.id,
      isCurrentUser,
      role: member.role,
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
