// Developmental stages for learning content
// Used to route to appropriate stage-specific prompts

export const LEARNING_STAGES = {
  IMMEDIATE_POSTBIRTH: 'immediate-postbirth',
  FIRST_WEEK: 'first-week',
  SECOND_WEEK: 'second-week',
  THIRD_WEEK: 'third-week',
  MONTH_ONE: 'month-one',
  MONTH_TWO: 'month-two',
  MONTH_THREE_FOUR: 'month-three-four',
} as const;

export type LearningStage = (typeof LEARNING_STAGES)[keyof typeof LEARNING_STAGES];

export interface StageDefinition {
  id: LearningStage;
  label: string;
  description: string;
  ageRange: {
    minDays: number;
    maxDays: number;
  };
  focusAreas: string[];
  commonTopics: string[];
}

export const STAGE_DEFINITIONS: Record<LearningStage, StageDefinition> = {
  [LEARNING_STAGES.IMMEDIATE_POSTBIRTH]: {
    id: LEARNING_STAGES.IMMEDIATE_POSTBIRTH,
    label: 'Immediate Postbirth (Days 1-3)',
    description: 'Critical first days focusing on feeding initiation, diaper output, and when to call doctor',
    ageRange: { minDays: 1, maxDays: 3 },
    focusAreas: [
      'Feeding initiation',
      'Meconium and diaper output expectations',
      'Cord care',
      'Jaundice awareness',
      'When to call doctor',
    ],
    commonTopics: [
      'first-meconium',
      'colostrum-feeding',
      'cord-care',
      'jaundice-monitoring',
      'normal-weight-loss',
      'safe-sleep-basics',
    ],
  },
  [LEARNING_STAGES.FIRST_WEEK]: {
    id: LEARNING_STAGES.FIRST_WEEK,
    label: 'First Week (Days 4-7)',
    description: 'Milk coming in, establishing routines, and understanding normal newborn behaviors',
    ageRange: { minDays: 4, maxDays: 7 },
    focusAreas: [
      'Milk coming in',
      'Cluster feeding',
      'Day/night confusion',
      'Safe sleep practices',
      'Normal newborn behaviors',
    ],
    commonTopics: [
      'milk-coming-in',
      'cluster-feeding',
      'day-night-confusion',
      'diaper-color-transition',
      'feeding-on-demand',
      'postpartum-recovery',
    ],
  },
  [LEARNING_STAGES.SECOND_WEEK]: {
    id: LEARNING_STAGES.SECOND_WEEK,
    label: 'Second Week (Days 8-14)',
    description: 'Building confidence, reading cues, and preparing for two-week checkup',
    ageRange: { minDays: 8, maxDays: 14 },
    focusAreas: [
      'Reading baby cues',
      'Developmental observations',
      'Feeding efficiency',
      'Bonding activities',
      'Two-week checkup prep',
    ],
    commonTopics: [
      'hunger-cues',
      'sleep-cues',
      'developmental-tracking',
      'tummy-time-intro',
      'weight-gain',
      'two-week-checkup',
    ],
  },
  [LEARNING_STAGES.THIRD_WEEK]: {
    id: LEARNING_STAGES.THIRD_WEEK,
    label: 'Third Week (Days 15-21)',
    description: 'Emerging patterns, social development, and continued growth monitoring',
    ageRange: { minDays: 15, maxDays: 21 },
    focusAreas: [
      'Emerging feeding patterns',
      'Early social smiles',
      'Tracking and focus',
      'Sleep patterns',
      'Growth monitoring',
    ],
    commonTopics: [
      'feeding-patterns',
      'early-smiling',
      'visual-tracking',
      'sleep-stretches',
      'growth-spurts',
      'tummy-time-progression',
    ],
  },
  [LEARNING_STAGES.MONTH_ONE]: {
    id: LEARNING_STAGES.MONTH_ONE,
    label: 'Month One (Weeks 4-6)',
    description: 'Developmental milestones, routine establishment, and one-month checkup',
    ageRange: { minDays: 22, maxDays: 42 },
    focusAreas: [
      'One-month milestones',
      'Routine establishment',
      'Social interaction',
      'Physical development',
      'Feeding rhythm',
    ],
    commonTopics: [
      'one-month-milestones',
      'social-smiling',
      'head-control',
      'feeding-schedule',
      'sleep-regression-4week',
      'vaccines',
    ],
  },
  [LEARNING_STAGES.MONTH_TWO]: {
    id: LEARNING_STAGES.MONTH_TWO,
    label: 'Month Two (Weeks 7-10)',
    description: 'Increased alertness, vocalization, and developmental leaps',
    ageRange: { minDays: 43, maxDays: 70 },
    focusAreas: [
      'Vocalization',
      'Increased alertness',
      'Hand-eye coordination',
      'Sleep consolidation',
      'Two-month checkup',
    ],
    commonTopics: [
      'cooing-sounds',
      'batting-at-objects',
      'longer-sleep-stretches',
      'two-month-milestones',
      'vaccines-2month',
      'rolling-attempts',
    ],
  },
  [LEARNING_STAGES.MONTH_THREE_FOUR]: {
    id: LEARNING_STAGES.MONTH_THREE_FOUR,
    label: 'Months Three-Four (Weeks 11-16)',
    description: 'Major developmental changes, sleep regression, and increased interaction',
    ageRange: { minDays: 71, maxDays: 112 },
    focusAreas: [
      'Major milestones',
      'Sleep regression',
      'Increased interaction',
      'Motor development',
      'Feeding changes',
    ],
    commonTopics: [
      'four-month-sleep-regression',
      'rolling-over',
      'laughing',
      'reaching-grasping',
      'three-month-milestones',
      'four-month-checkup',
    ],
  },
};

/**
 * Determines the appropriate learning stage based on baby's age in days
 */
export function determineStage(ageInDays: number): LearningStage {
  // Find the matching stage
  for (const stage of Object.values(STAGE_DEFINITIONS)) {
    if (ageInDays >= stage.ageRange.minDays && ageInDays <= stage.ageRange.maxDays) {
      return stage.id;
    }
  }

  // Default to the last stage if beyond range
  if (ageInDays > 112) {
    return LEARNING_STAGES.MONTH_THREE_FOUR;
  }

  // Default to first stage if somehow below range
  return LEARNING_STAGES.IMMEDIATE_POSTBIRTH;
}

/**
 * Gets the stage definition for a given stage ID
 */
export function getStageDefinition(stage: LearningStage): StageDefinition {
  return STAGE_DEFINITIONS[stage];
}

/**
 * Gets the stage definition for a given age in days
 */
export function getStageForAge(ageInDays: number): StageDefinition {
  const stageId = determineStage(ageInDays);
  return getStageDefinition(stageId);
}

