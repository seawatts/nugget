/**
 * Milestone content rules for First Week (Days 4-7)
 * Focus: Increasing alertness, feeding efficiency, diaper transitions
 */

import type { StageMilestoneRules } from './immediate-postbirth';

export const firstWeekMilestoneRules: StageMilestoneRules = {
  ageRange: {
    maxDays: 7,
    minDays: 4,
  },
  avoidMilestones: [
    'social-smile',
    'head-lift-tummy-time',
    'rolls-over',
    'reaches-for-toys',
  ],
  developmentalFocus: 'Increasing alertness and sensory responses',
  evidenceBase: ['CDC', 'AAP', 'WHO'],
  label: 'First Week (Days 4-7)',
  milestones: [
    {
      expectedInStage: true,
      id: 'yellow-stool-transition',
      priority: 5,
      requiresYesNo: true,
      title: 'Yellow Stool Transition',
      type: 'self_care',
    },
    {
      expectedInStage: true,
      id: 'longer-alert-periods',
      priority: 4,
      requiresYesNo: true,
      title: 'Longer Alert Periods',
      type: 'cognitive',
    },
    {
      expectedInStage: true,
      id: 'tracks-movement-briefly',
      priority: 3,
      requiresYesNo: true,
      title: 'Tracks Movement Briefly',
      type: 'cognitive',
    },
    {
      expectedInStage: true,
      id: 'responds-to-sounds',
      priority: 4,
      requiresYesNo: true,
      title: 'Responds to Sounds',
      type: 'cognitive',
    },
  ],
  stage: 'first-week',
};
