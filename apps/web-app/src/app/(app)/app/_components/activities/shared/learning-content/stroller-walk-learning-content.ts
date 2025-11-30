interface LearningContent {
  message: string;
  tips: string[];
}

/**
 * Get age-appropriate stroller walk learning content
 */
export function getStrollerWalkLearningContent(
  ageDays: number,
): LearningContent {
  // 0-30 days (first month)
  if (ageDays <= 30) {
    return {
      message:
        'Fresh air and gentle movement can be beneficial for both you and your newborn. Start with short, slow walks in a stroller or carrier.',
      tips: [
        'Use a stroller or baby carrier',
        'Keep walks short (10-15 minutes)',
        'Avoid extreme temperatures',
        'Protect from direct sunlight',
      ],
    };
  }

  // 31-90 days (1-3 months)
  if (ageDays <= 90) {
    return {
      message:
        'Regular walks help establish routines and provide sensory stimulation. Babies enjoy the movement and new sights and sounds.',
      tips: [
        'Aim for daily walks when weather permits',
        'Use appropriate stroller or carrier',
        'Dress baby appropriately for weather',
        'Watch for signs of overstimulation',
      ],
    };
  }

  // 91-180 days (3-6 months)
  if (ageDays <= 180) {
    return {
      message:
        'As your baby becomes more alert and curious, walks provide valuable sensory experiences and help with sleep regulation.',
      tips: [
        'Daily walks support healthy sleep patterns',
        'Baby can now see more of the world',
        'Great for establishing routines',
        'Helps with physical development',
      ],
    };
  }

  // 181-365 days (6-12 months)
  if (ageDays <= 365) {
    return {
      message:
        'Walking becomes even more important as your baby grows. It supports physical development, provides exercise, and helps with sleep.',
      tips: [
        'Daily walks recommended',
        'Supports motor skill development',
        'Great for language development (point out things)',
        'Helps regulate sleep and mood',
      ],
    };
  }

  // 365+ days (1+ years)
  return {
    message:
      'Regular walks are essential for toddlers. They provide exercise, fresh air, and opportunities for exploration and learning.',
    tips: [
      'Daily walks support healthy development',
      'Encourage walking when baby is ready',
      'Great for language and social development',
      'Helps with energy regulation',
    ],
  };
}
