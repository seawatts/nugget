interface LearningContent {
  message: string;
  tips: string[];
}

/**
 * Get age-appropriate sleep learning content
 */
export function getSleepLearningContent(ageDays: number): LearningContent {
  // 0-7 days
  if (ageDays <= 7) {
    return {
      message:
        'Newborns sleep 16-18 hours per day in short bursts. We predict wake times based on typical 1-2 hour cycles.',
      tips: ['Safe sleep on back', 'Dark quiet room', 'Watch for sleepy cues'],
    };
  }

  // 8-14 days
  if (ageDays <= 14) {
    return {
      message:
        "Sleep patterns are forming. Predictions use your baby's recent naps plus expected wake windows for this age.",
      tips: [
        'Start a simple routine',
        'Track wake windows',
        'Look for drowsy signs',
      ],
    };
  }

  // 15-30 days
  if (ageDays <= 30) {
    return {
      message:
        "Baby's wake windows extend to 1-2 hours. We analyze sleep/wake patterns to predict the next nap.",
      tips: [
        'Consistent sleep environment',
        'Note optimal nap times',
        'Watch for overtiredness',
      ],
    };
  }

  // 31-60 days
  if (ageDays <= 60) {
    return {
      message:
        "Longer sleep stretches emerge. Our predictions combine your baby's pattern with typical 2-3 hour wake windows.",
      tips: [
        'Consistent sleep environment',
        'Note optimal nap times',
        'Watch for overtiredness',
      ],
    };
  }

  // 61+ days
  return {
    message:
      "Sleep consolidates into longer periods. We use your baby's established rhythm for predictions.",
    tips: [
      'Consistent sleep environment',
      'Note optimal nap times',
      'Watch for overtiredness',
    ],
  };
}
