/**
 * Milestone content rules for Third Week (Days 15-21)
 * Focus: Early social smiles, improved tracking, longer alert periods
 */

import type { StageMilestoneRules } from './immediate-postbirth';

export const thirdWeekMilestoneRules: StageMilestoneRules = {
  ageRange: {
    maxDays: 21,
    minDays: 15,
  },
  avoidMilestones: [
    'laughs',
    'rolls-over',
    'reaches-for-objects',
    'sits-with-support',
  ],
  developmentalFocus: 'Early social engagement',
  evidenceBase: ['CDC', 'AAP', 'WHO'],
  label: 'Third Week (Days 15-21)',
  milestones: [
    {
      expectedInStage: true,
      id: 'first-social-smile',
      priority: 5,
      requiresYesNo: true,
      title: 'First Social Smile',
      type: 'social',
    },
    {
      expectedInStage: true,
      id: 'tracks-moving-objects',
      priority: 4,
      requiresYesNo: true,
      title: 'Tracks Moving Objects',
      type: 'cognitive',
    },
    {
      expectedInStage: true,
      id: 'recognizes-caregiver',
      priority: 4,
      requiresYesNo: true,
      title: 'Recognizes Caregiver',
      type: 'social',
    },
    {
      expectedInStage: true,
      id: 'coos-occasionally',
      priority: 3,
      requiresYesNo: true,
      title: 'Coos Occasionally',
      type: 'language',
    },
  ],
  stage: 'third-week',
};
