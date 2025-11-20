interface LearningContent {
  message: string;
  tips: string[];
}

/**
 * Get age-appropriate feeding learning content
 */
export function getFeedingLearningContent(ageDays: number): LearningContent {
  // 0-7 days
  if (ageDays <= 7) {
    return {
      message:
        'Newborns have tiny stomachs and need frequent feeding. We predict based on typical 2-3 hour intervals for this age.',
      tips: [
        'Watch for hunger cues',
        'Feed on demand even at night',
        'Track wet/dirty diapers',
      ],
    };
  }

  // 8-14 days
  if (ageDays <= 14) {
    return {
      message:
        "Your baby is establishing a feeding rhythm. Predictions use your baby's recent pattern plus typical 3-hour intervals.",
      tips: [
        'Look for a consistent pattern',
        'Note feeding duration',
        'Stay flexible with timing',
      ],
    };
  }

  // 15-30 days
  if (ageDays <= 30) {
    return {
      message:
        "Baby may start spacing feedings to 3-4 hours. We analyze your baby's unique pattern to predict the next feeding.",
      tips: [
        "Trust your baby's signals",
        'Keep tracking for patterns',
        'Consult pediatrician if concerned',
      ],
    };
  }

  // 31-60 days
  if (ageDays <= 60) {
    return {
      message:
        "Most babies settle into a 4-hour schedule. Our predictions combine your baby's history with age-appropriate intervals.",
      tips: [
        "Trust your baby's signals",
        'Keep tracking for patterns',
        'Consult pediatrician if concerned',
      ],
    };
  }

  // 61+ days
  return {
    message:
      "Feedings typically occur every 4-5 hours. We use your baby's established pattern for accurate predictions.",
    tips: [
      "Trust your baby's signals",
      'Keep tracking for patterns',
      'Consult pediatrician if concerned',
    ],
  };
}
