interface LearningContent {
  message: string;
  tips: string[];
}

/**
 * Get age-appropriate bathing learning content
 */
export function getBathLearningContent(ageDays: number): LearningContent {
  // 0-7 days (first week)
  if (ageDays <= 7) {
    return {
      message:
        "Until the umbilical cord falls off, give sponge baths only. Aim for 2-3 times per week. Newborns don't need daily baths.",
      tips: [
        'Use sponge bath until cord falls off',
        '2-3 times per week is sufficient',
        'Keep bath short (5-10 minutes)',
        'Water should be warm, not hot (90-100°F)',
      ],
    };
  }

  // 8-30 days (first month)
  if (ageDays <= 30) {
    return {
      message:
        'Once the cord falls off, you can give regular baths. 2-3 times per week is plenty - too frequent bathing can dry out skin.',
      tips: [
        'Bath 2-3 times per week',
        'Use mild, fragrance-free soap',
        'Support head and neck',
        'Never leave baby unattended',
      ],
    };
  }

  // 31-180 days (1-6 months)
  if (ageDays <= 180) {
    return {
      message:
        'Continue bathing 3 times per week. As babies become more active and start solids, you may need more frequent baths.',
      tips: [
        'Increase to 3-4 times per week',
        'Check water temperature',
        'Make bath time fun',
        'Use gentle baby products',
      ],
    };
  }

  // 181+ days (6+ months)
  return {
    message:
      'Toddlers may need more frequent baths due to increased activity and messiness. Daily baths are fine if you use gentle products.',
    tips: [
      '3-4 times per week minimum',
      'Daily baths OK with gentle products',
      'Make bath time routine consistent',
      'Always supervise closely',
    ],
  };
}
