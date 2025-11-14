'use server';

import { createCaller, createTRPCContext } from '@nugget/api';
import { createSafeActionClient } from 'next-safe-action';

const action = createSafeActionClient();

/**
 * Fetch family members for the current user's family
 */
export const getFamilyMembersAction = action.action(async () => {
  const ctx = await createTRPCContext();
  const caller = createCaller(ctx);

  // Get all family members
  const members = await caller.familyMembers.all();

  // Get current user to ensure they're included
  const currentUser = await caller.user.current();

  // Map members to simpler format
  const memberList = members.map((member) => ({
    id: member.id,
    isCurrentUser: member.userId === ctx.auth?.userId,
    name: member.user?.firstName
      ? `${member.user.firstName}${member.user.lastName ? ` ${member.user.lastName}` : ''}`
      : member.user?.email || 'Unknown',
    userId: member.userId,
  }));

  // If current user is not in the list, add them
  if (currentUser && !memberList.some((m) => m.userId === currentUser.id)) {
    memberList.unshift({
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
