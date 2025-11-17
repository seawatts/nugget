/**
 * Milestone content rules for Second Week (Days 8-14)
 * Focus: Social awareness emerging, visual tracking, head control beginning
 */

import type { StageMilestoneRules } from './immediate-postbirth';

export const secondWeekMilestoneRules: StageMilestoneRules = {
  ageRange: {
    maxDays: 14,
    minDays: 8,
  },
  avoidMilestones: [
    'social-smile',
    'coos-gurgles',
    'rolls-over',
    'reaches-for-objects',
  ],
  developmentalFocus: 'Social awareness and visual tracking',
  evidenceBase: ['CDC', 'AAP', 'WHO'],
  label: 'Second Week (Days 8-14)',
  milestones: [
    {
      expectedInStage: true,
      id: 'tracks-faces',
      priority: 4,
      requiresYesNo: true,
      title: 'Tracks Faces',
      type: 'social',
    },
    {
      expectedInStage: true,
      id: 'brief-head-lift-tummy-time',
      priority: 4,
      requiresYesNo: true,
      title: 'Brief Head Lift During Tummy Time',
      type: 'physical',
    },
    {
      expectedInStage: true,
      id: 'responds-to-voice',
      priority: 4,
      requiresYesNo: true,
      title: 'Responds to Voice',
      type: 'cognitive',
    },
    {
      expectedInStage: true,
      id: 'makes-eye-contact',
      priority: 5,
      requiresYesNo: true,
      title: 'Makes Eye Contact',
      type: 'social',
    },
  ],
  stage: 'second-week',
};
