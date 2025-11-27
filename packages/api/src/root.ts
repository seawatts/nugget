import { activitiesRouter } from './router/activities';
import { babiesRouter } from './router/babies';
import { billingRouter } from './router/billing';
import { celebrationsRouter } from './router/celebrations';
import { chatsRouter } from './router/chats';
import { developmentalPhasesRouter } from './router/developmental-phases';
import { familyRouter } from './router/family';
import { familyMembersRouter } from './router/family-members';
import { familyTabsRouter } from './router/family-tabs';
import { invitationsRouter } from './router/invitations';
import { learningRouter } from './router/learning';
import { milestonesRouter } from './router/milestones';
import { milestonesCarouselRouter } from './router/milestones-carousel';
import { onboardingRouter } from './router/onboarding';
import { parentWellnessRouter } from './router/parent-wellness';
import { supplyInventoryRouter } from './router/supply-inventory';
import { supplyTransactionsRouter } from './router/supply-transactions';
import { timelineRouter } from './router/timeline';
import { userRouter } from './router/user';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  activities: activitiesRouter,
  babies: babiesRouter,
  billing: billingRouter,
  celebrations: celebrationsRouter,
  chats: chatsRouter,
  developmentalPhases: developmentalPhasesRouter,
  family: familyRouter,
  familyMembers: familyMembersRouter,
  familyTabs: familyTabsRouter,
  invitations: invitationsRouter,
  learning: learningRouter,
  milestones: milestonesRouter,
  milestonesCarousel: milestonesCarouselRouter,
  onboarding: onboardingRouter,
  parentWellness: parentWellnessRouter,
  supplyInventory: supplyInventoryRouter,
  supplyTransactions: supplyTransactionsRouter,
  timeline: timelineRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export type {
  CelebrationCardData,
  CelebrationCarouselData,
} from './router/celebrations';
export type { FamilyTabMember } from './router/family-tabs';
export type { LearningTip } from './router/learning';
// Export types from routers for use in components
export type { MilestoneCarouselCardData } from './router/milestones-carousel';
export type { TimelineItem } from './router/timeline';
