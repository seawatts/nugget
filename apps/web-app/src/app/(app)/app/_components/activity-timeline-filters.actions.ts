'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import { createSafeActionClient } from 'next-safe-action';

const action = createSafeActionClient();

/**
 * Fetch family members for the current user's family
 */
export const getFamilyMembersAction = action.action(async () => {
  const api = await getApi();
  const authResult = await auth();

  // Get all family members
  const members = await api.familyMembers.all();

  // Get current user to ensure they're included
  const currentUser = await api.user.current();

  // Map members to simpler format
  const memberList = members.map((member) => ({
    avatarUrl: member.user?.avatarUrl || null,
    id: member.id,
    isCurrentUser: member.userId === authResult?.userId,
    name: member.user?.firstName
      ? `${member.user.firstName}${member.user.lastName ? ` ${member.user.lastName}` : ''}`
      : member.user?.email || 'Unknown',
    userId: member.userId,
  }));

  // If current user is not in the list, add them
  if (currentUser && !memberList.some((m) => m.userId === currentUser.id)) {
    memberList.unshift({
      avatarUrl: currentUser.avatarUrl || null,
      id: currentUser.id,
      isCurrentUser: true,
      name: currentUser.firstName
        ? `${currentUser.firstName}${currentUser.lastName ? ` ${currentUser.lastName}` : ''}`
        : currentUser.email || 'Unknown',
      userId: currentUser.id,
    });
  }

  return memberList;
});
