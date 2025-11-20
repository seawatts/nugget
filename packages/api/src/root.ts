import { activitiesRouter } from './router/activities';
import { babiesRouter } from './router/babies';
import { billingRouter } from './router/billing';
import { chatsRouter } from './router/chats';
import { familyRouter } from './router/family';
import { familyMembersRouter } from './router/family-members';
import { invitationsRouter } from './router/invitations';
import { milestonesRouter } from './router/milestones';
import { onboardingRouter } from './router/onboarding';
import { supplyInventoryRouter } from './router/supply-inventory';
import { supplyTransactionsRouter } from './router/supply-transactions';
import { userRouter } from './router/user';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  activities: activitiesRouter,
  babies: babiesRouter,
  billing: billingRouter,
  chats: chatsRouter,
  family: familyRouter,
  familyMembers: familyMembersRouter,
  invitations: invitationsRouter,
  milestones: milestonesRouter,
  onboarding: onboardingRouter,
  supplyInventory: supplyInventoryRouter,
  supplyTransactions: supplyTransactionsRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
