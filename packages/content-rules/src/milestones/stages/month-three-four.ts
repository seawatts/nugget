/**
 * Milestone content rules for Months Three-Four (Weeks 11-16 / Days 71-112)
 * Focus: Rolling, reaching, grasping, laughing
 */

import type { StageMilestoneRules } from './immediate-postbirth';

export const monthThreeFourMilestoneRules: StageMilestoneRules = {
  ageRange: {
    maxDays: 112,
    minDays: 71,
  },
  avoidMilestones: ['sits-independently', 'crawls', 'pulls-to-stand', 'walks'],
  developmentalFocus: 'Major motor milestones: rolling, reaching, grasping',
  evidenceBase: ['CDC', 'AAP', 'WHO'],
  label: 'Months Three-Four (Weeks 11-16)',
  milestones: [
    {
      expectedInStage: true,
      id: 'rolls-over',
      priority: 5,
      requiresYesNo: true,
      title: 'Rolls Over',
      type: 'physical',
    },
    {
      expectedInStage: true,
      id: 'reaches-for-objects',
      priority: 5,
      requiresYesNo: true,
      title: 'Reaches for Objects',
      type: 'physical',
    },
    {
      expectedInStage: true,
      id: 'grasps-toys',
      priority: 4,
      requiresYesNo: true,
      title: 'Grasps Toys',
      type: 'physical',
    },
    {
      expectedInStage: true,
      id: 'laughs-out-loud',
      priority: 4,
      requiresYesNo: true,
      title: 'Laughs Out Loud',
      type: 'social',
    },
    {
      expectedInStage: true,
      id: 'pushes-up-on-arms',
      priority: 4,
      requiresYesNo: true,
      title: 'Pushes Up on Arms',
      type: 'physical',
    },
  ],
  stage: 'month-three-four',
};
