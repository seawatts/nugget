/**
 * App Components Barrel Exports
 *
 * Organized by domain for easy importing
 *
 * @example
 * import { QuickChatDialog, ActivityTimeline, LearningCarousel } from '@/app/(app)/app/_components';
 */

// ============================================================================
// Activities Domain
// ============================================================================
export { ActivityCard } from './activities/activity-card';
export { ActivityCards } from './activities/activity-cards';
export { ActivityDrawer } from './activities/activity-drawer';
export { ActivityTimeline } from './activities/timeline/activity-timeline';
export { ActivityTimelineFilters } from './activities/timeline/activity-timeline-filters';
export { useActivityMutations } from './activities/use-activity-mutations';
export { BottomNav } from './bottom-nav';
// ============================================================================
// Celebrations Domain
// ============================================================================
export { CelebrationCard } from './celebrations/celebration-card';
export { CelebrationMemoryDialog } from './celebrations/celebration-memory-dialog';
export { CelebrationsCarousel } from './celebrations/celebrations-carousel';
// ============================================================================
// Chat Domain
// ============================================================================
export { ChatDialog } from './chat/chat-dialog';
export { QuickChatDialog } from './chat/quick-chat-dialog';
export { QuickChatFab } from './chat/quick-chat-fab';
// ============================================================================
// Root Level Components
// ============================================================================
export { FamilyTabs } from './family-tabs';
export { Header } from './header';
// ============================================================================
// Learning Domain
// ============================================================================
export { LearningCarousel } from './learning/learning-carousel';
export { LearningSection } from './learning/learning-section';
// ============================================================================
// Milestones Domain
// ============================================================================
export { MilestoneCard } from './milestones/milestone-card';
export { MilestonesCarousel } from './milestones/milestones-carousel';
export { useMilestoneMutations } from './milestones/use-milestone-mutations';
export { OnboardingCheck } from './onboarding-check';
export { ParentDailyCheckInCard } from './parent/parent-daily-checkin-card';
// ============================================================================
// Parent Domain
// ============================================================================
export { ParentDashboard } from './parent/parent-dashboard';
export { ParentLearningCarousel } from './parent/parent-learning-carousel';
export { ParentSleepCard } from './parent/parent-sleep-card';
export { ParentTasksCard } from './parent/parent-tasks-card';
export { ParentTipsWidget } from './parent/parent-tips-widget';
export { ParentWellnessCard } from './parent/parent-wellness-card';
export { ScrollProvider } from './scroll-provider';
// ============================================================================
// Shared Components
// ============================================================================
export { InfoCard } from './shared/info-card';
export { QuickActionCard } from './shared/quick-action-card';
export { SweetSpotBanner } from './shared/sweet-spot-banner';
export { ThemeProvider } from './theme-provider';
export { TodaySummaryCard } from './today-summary-card';
