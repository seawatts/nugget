/**
 * Content rules for First Week (Days 4-7)
 */

import type { StageContentRules } from './immediate-postbirth';

export const firstWeekRules: StageContentRules = {
  ageRange: {
    maxDays: 7,
    minDays: 4,
  },
  avoidTopics: ['sleep-training', 'solid-foods', 'developmental-milestones'],
  healthChecksRequired: ['adequate-diaper-output', 'feeding-frequency'],
  label: 'First Week (Days 4-7)',
  stage: 'first-week',
  topics: [
    {
      category: 'feeding',
      id: 'milk-coming-in',
      priority: 5,
      requiresYesNo: true,
    },
    {
      category: 'feeding',
      id: 'cluster-feeding',
      priority: 4,
      requiresYesNo: false,
    },
    {
      category: 'sleep',
      id: 'day-night-confusion',
      priority: 4,
      requiresYesNo: true,
    },
    {
      category: 'diaper',
      id: 'diaper-color-transition',
      priority: 4,
      requiresYesNo: true,
    },
    {
      category: 'feeding',
      id: 'feeding-on-demand',
      priority: 4,
      requiresYesNo: false,
    },
    {
      category: 'postpartum',
      id: 'postpartum-recovery',
      priority: 4,
      requiresYesNo: false,
    },
  ],
  yesNoRequired: true,
};
