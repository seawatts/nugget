/**
 * Content rules for Immediate Postbirth (Days 1-3)
 */

export interface TopicRule {
  id: string;
  category:
    | 'feeding'
    | 'sleep'
    | 'diaper'
    | 'development'
    | 'health'
    | 'postpartum';
  priority: 1 | 2 | 3 | 4 | 5; // 5 = urgent/critical, 1 = nice-to-know
  requiresYesNo: boolean;
}

export interface StageContentRules {
  stage: string;
  label: string;
  ageRange: {
    minDays: number;
    maxDays: number;
  };
  topics: TopicRule[];
  avoidTopics: string[];
  yesNoRequired: boolean;
  healthChecksRequired: string[];
}

export const immediatePostbirthRules: StageContentRules = {
  ageRange: {
    maxDays: 3,
    minDays: 1,
  },
  avoidTopics: [
    'sleep-training',
    'solid-foods',
    'developmental-milestones',
    'rolling-over',
    'tummy-time',
  ],
  healthChecksRequired: [
    'diaper-output',
    'feeding-frequency',
    'jaundice-check',
  ],
  label: 'Immediate Postbirth (Days 1-3)',
  stage: 'immediate-postbirth',
  topics: [
    {
      category: 'diaper',
      id: 'first-meconium',
      priority: 5,
      requiresYesNo: true,
    },
    {
      category: 'feeding',
      id: 'colostrum-feeding',
      priority: 5,
      requiresYesNo: true,
    },
    {
      category: 'health',
      id: 'cord-care',
      priority: 4,
      requiresYesNo: true,
    },
    {
      category: 'health',
      id: 'jaundice-monitoring',
      priority: 5,
      requiresYesNo: true,
    },
    {
      category: 'health',
      id: 'normal-weight-loss',
      priority: 4,
      requiresYesNo: false,
    },
    {
      category: 'sleep',
      id: 'safe-sleep-basics',
      priority: 5,
      requiresYesNo: false,
    },
    {
      category: 'health',
      id: 'when-to-call-doctor',
      priority: 5,
      requiresYesNo: false,
    },
    {
      category: 'feeding',
      id: 'first-latch',
      priority: 5,
      requiresYesNo: true,
    },
  ],
  yesNoRequired: true,
};
