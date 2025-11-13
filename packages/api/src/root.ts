import { activitiesRouter } from './router/activities';
import { babiesRouter } from './router/babies';
import { billingRouter } from './router/billing';
import { onboardingRouter } from './router/onboarding';
import { orgRouter } from './router/org';
import { orgMembersRouter } from './router/org-members';
import { supplyInventoryRouter } from './router/supply-inventory';
import { supplyTransactionsRouter } from './router/supply-transactions';
import { userRouter } from './router/user';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  activities: activitiesRouter,
  babies: babiesRouter,
  billing: billingRouter,
  onboarding: onboardingRouter,
  org: orgRouter,
  orgMembers: orgMembersRouter,
  supplyInventory: supplyInventoryRouter,
  supplyTransactions: supplyTransactionsRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
