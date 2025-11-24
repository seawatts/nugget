import { createTRPCRouter, protectedProcedure } from '../trpc';

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

export const familyTabsRouter = createTRPCRouter({
  /**
   * Fetch all family members and babies for display in tabs
   */
  getTabsData: protectedProcedure.query(
    async ({ ctx }): Promise<FamilyTabMember[]> => {
      if (!ctx.auth.userId) {
        return [];
      }

      // Get all babies
      const babies = await ctx.db.query.Babies.findMany({
        where: (babies, { eq }) =>
          ctx.auth.orgId ? eq(babies.familyId, ctx.auth.orgId) : undefined,
      });

      // Get all family members
      const members = await ctx.db.query.FamilyMembers.findMany({
        where: (familyMembers, { eq }) =>
          ctx.auth.orgId
            ? eq(familyMembers.familyId, ctx.auth.orgId)
            : undefined,
        with: {
          user: true,
        },
      });

      // Get current user to ensure they're included
      const currentUser = await ctx.db.query.Users.findFirst({
        where: (users, { eq }) => eq(users.id, ctx.auth.userId),
      });

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
        const isCurrentUser = member.userId === ctx.auth.userId;
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
    },
  ),
});
