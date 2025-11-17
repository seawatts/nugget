/**
 * Milestone content rules for Month One (Weeks 4-6 / Days 22-42)
 * Focus: Social smiling, head control improving, vocalization starting
 */

import type { StageMilestoneRules } from './immediate-postbirth';

export const monthOneMilestoneRules: StageMilestoneRules = {
  ageRange: {
    maxDays: 42,
    minDays: 22,
  },
  avoidMilestones: [
    'laughs-out-loud',
    'rolls-over',
    'reaches-for-toys',
    'sits-with-support',
  ],
  developmentalFocus: 'Social smiling and improved motor control',
  evidenceBase: ['CDC', 'AAP', 'WHO'],
  label: 'Month One (Weeks 4-6)',
  milestones: [
    {
      expectedInStage: true,
      id: 'social-smiling',
      priority: 5,
      requiresYesNo: true,
      title: 'Social Smiling',
      type: 'social',
    },
    {
      expectedInStage: true,
      id: 'holds-head-up-45-degrees',
      priority: 4,
      requiresYesNo: true,
      title: 'Holds Head Up 45° During Tummy Time',
      type: 'physical',
    },
    {
      expectedInStage: true,
      id: 'follows-objects-180-degrees',
      priority: 4,
      requiresYesNo: true,
      title: 'Follows Objects 180°',
      type: 'cognitive',
    },
    {
      expectedInStage: true,
      id: 'coos-and-gurgles',
      priority: 4,
      requiresYesNo: true,
      title: 'Coos and Gurgles',
      type: 'language',
    },
  ],
  stage: 'month-one',
};
