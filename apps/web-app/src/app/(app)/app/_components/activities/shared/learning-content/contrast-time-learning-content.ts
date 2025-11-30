interface LearningContent {
  message: string;
  tips: string[];
}

/**
 * Get age-appropriate contrast time learning content
 */
export function getContrastTimeLearningContent(
  ageDays: number,
): LearningContent {
  // 0-30 days (first month)
  if (ageDays <= 30) {
    return {
      message:
        'Newborns can see high-contrast patterns best. Black and white contrast cards and books are perfect for visual stimulation during this early stage.',
      tips: [
        'Use high-contrast black and white cards or books',
        "Hold cards 8-12 inches from baby's face",
        'Keep sessions short (2-5 minutes)',
        'Watch for signs of overstimulation',
      ],
    };
  }

  // 31-90 days (1-3 months)
  if (ageDays <= 90) {
    return {
      message:
        "Your baby's vision is improving and they can now see more colors. Continue with high-contrast materials while gradually introducing more colorful patterns.",
      tips: [
        'Continue with black and white contrast materials',
        'Start introducing red and other bright colors',
        'Use contrast books with simple patterns',
        'Keep sessions engaging but not too long',
      ],
    };
  }

  // 91-180 days (3-6 months)
  if (ageDays <= 180) {
    return {
      message:
        'Your baby can now see a wider range of colors and more complex patterns. Contrast time helps develop visual tracking and focus skills.',
      tips: [
        'Use more complex patterns and colors',
        'Introduce interactive contrast books',
        'Encourage visual tracking by moving materials slowly',
        'Make it part of daily routine',
      ],
    };
  }

  // 181-365 days (6-12 months)
  if (ageDays <= 365) {
    return {
      message:
        'Visual stimulation through contrast materials and books supports cognitive development and helps build focus and attention skills.',
      tips: [
        'Use colorful picture books with high contrast',
        'Point out and name objects in books',
        'Make it interactive and engaging',
        'Support language development through reading',
      ],
    };
  }

  // 365+ days (1+ years)
  return {
    message:
      'Contrast time and reading continue to be important for visual development, language skills, and cognitive growth. Make it a fun, interactive experience.',
    tips: [
      'Continue with colorful books and visual materials',
      'Encourage pointing and naming',
      'Support language and vocabulary development',
      'Make reading a daily routine',
    ],
  };
}
