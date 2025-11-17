/**
 * Milestone content rules for Month Two (Weeks 7-10 / Days 43-70)
 * Focus: Purposeful movements, vocalization, social engagement
 */

import type { StageMilestoneRules } from './immediate-postbirth';

export const monthTwoMilestoneRules: StageMilestoneRules = {
  ageRange: {
    maxDays: 70,
    minDays: 43,
  },
  avoidMilestones: [
    'rolls-over',
    'reaches-for-toys',
    'sits-independently',
    'crawls',
  ],
  developmentalFocus: 'Interactive cooing and stronger motor control',
  evidenceBase: ['CDC', 'AAP', 'WHO'],
  label: 'Month Two (Weeks 7-10)',
  milestones: [
    {
      expectedInStage: true,
      id: 'coos-back-and-forth',
      priority: 5,
      requiresYesNo: true,
      title: 'Coos Back and Forth',
      type: 'language',
    },
    {
      expectedInStage: true,
      id: 'lifts-head-90-degrees',
      priority: 4,
      requiresYesNo: true,
      title: 'Lifts Head 90° During Tummy Time',
      type: 'physical',
    },
    {
      expectedInStage: true,
      id: 'brings-hands-to-mouth',
      priority: 4,
      requiresYesNo: true,
      title: 'Brings Hands to Mouth',
      type: 'physical',
    },
    {
      expectedInStage: true,
      id: 'laughs',
      priority: 4,
      requiresYesNo: true,
      title: 'Laughs',
      type: 'social',
    },
  ],
  stage: 'month-two',
};
