interface LearningContent {
  message: string;
  tips: string[];
}

/**
 * Get age-appropriate pumping learning content
 */
export function getPumpingLearningContent(ageDays: number): LearningContent {
  // 0-7 days
  if (ageDays <= 7) {
    return {
      message:
        'Early pumping helps establish milk supply. We predict pumping times based on recommended 2-3 hour intervals.',
      tips: [
        'Pump both breasts simultaneously',
        'Stay hydrated and well-fed',
        'Keep pumping for 15-20 minutes',
      ],
    };
  }

  // 8-14 days
  if (ageDays <= 14) {
    return {
      message:
        'Your supply is establishing. Predictions use your recent pumping pattern plus recommended intervals.',
      tips: [
        'Pump at the same times daily',
        'Massage breasts before pumping',
        'Look at baby photos to help letdown',
      ],
    };
  }

  // 15-30 days
  if (ageDays <= 30) {
    return {
      message:
        'Building supply requires consistency. We analyze your pumping rhythm to predict optimal times.',
      tips: [
        'Maintain 8 pumping sessions daily',
        'Power pump if supply is low',
        'Ensure proper flange fit',
      ],
    };
  }

  // 31-60 days
  if (ageDays <= 60) {
    return {
      message:
        'Your supply is established. Our predictions combine your pattern with supply maintenance intervals.',
      tips: [
        'Continue regular schedule',
        'Track output to monitor supply',
        'Replace pump parts regularly',
      ],
    };
  }

  // 61+ days
  return {
    message:
      'Maintaining supply with 6-8 daily sessions. We use your established pumping rhythm for predictions.',
    tips: [
      'Continue regular schedule',
      'Track output to monitor supply',
      'Replace pump parts regularly',
    ],
  };
}
