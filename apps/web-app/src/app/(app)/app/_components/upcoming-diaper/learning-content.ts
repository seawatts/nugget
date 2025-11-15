interface LearningContent {
  message: string;
  tips: string[];
}

/**
 * Get age-appropriate diaper learning content
 */
export function getDiaperLearningContent(ageDays: number): LearningContent {
  // 0-7 days
  if (ageDays <= 7) {
    return {
      message:
        'Newborns typically need 8-12 diaper changes per day. We predict based on feeding patterns and typical 2-3 hour intervals.',
      tips: [
        'Check after each feeding',
        'Count wet/dirty diapers',
        'Contact doctor if fewer than 6 wet diapers',
      ],
    };
  }

  // 8-14 days
  if (ageDays <= 14) {
    return {
      message:
        'Output stabilizes to 6-8 changes daily. Predictions use recent patterns plus time since last feeding.',
      tips: [
        'Normal to see patterns forming',
        'Wet diapers indicate hydration',
        'Track types (wet/dirty/both)',
      ],
    };
  }

  // 15-30 days
  if (ageDays <= 30) {
    return {
      message:
        "Diaper frequency may decrease to 4-6 per day. We analyze your baby's unique timing and feeding correlation.",
      tips: [
        'Bowel movements may decrease',
        'Watch for discomfort signs',
        'Maintain diaper-free time',
      ],
    };
  }

  // 31-60 days
  if (ageDays <= 60) {
    return {
      message:
        'Most babies need 5-7 changes daily. Our predictions combine bowel patterns with feeding schedules.',
      tips: [
        'Bowel movements may decrease',
        'Watch for discomfort signs',
        'Maintain diaper-free time',
      ],
    };
  }

  // 61+ days
  return {
    message:
      "Expect 4-6 changes per day. We use your baby's established patterns for accurate predictions.",
    tips: [
      'Bowel movements may decrease',
      'Watch for discomfort signs',
      'Maintain diaper-free time',
    ],
  };
}
