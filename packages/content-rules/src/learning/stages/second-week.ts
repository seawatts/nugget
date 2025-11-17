/**
 * Content rules for Second Week (Days 8-14)
 */

import type { StageContentRules } from './immediate-postbirth';

export const secondWeekRules: StageContentRules = {
  ageRange: {
    maxDays: 14,
    minDays: 8,
  },
  avoidTopics: ['sleep-training', 'solid-foods'],
  healthChecksRequired: ['weight-gain'],
  label: 'Second Week (Days 8-14)',
  stage: 'second-week',
  topics: [
    {
      category: 'feeding',
      id: 'hunger-cues',
      priority: 4,
      requiresYesNo: false,
    },
    {
      category: 'sleep',
      id: 'sleep-cues',
      priority: 4,
      requiresYesNo: false,
    },
    {
      category: 'development',
      id: 'developmental-tracking',
      priority: 3,
      requiresYesNo: false,
    },
    {
      category: 'development',
      id: 'tummy-time-intro',
      priority: 3,
      requiresYesNo: false,
    },
    {
      category: 'health',
      id: 'weight-gain',
      priority: 5,
      requiresYesNo: true,
    },
    {
      category: 'health',
      id: 'two-week-checkup',
      priority: 4,
      requiresYesNo: false,
    },
  ],
  yesNoRequired: true,
};
