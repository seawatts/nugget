interface LearningContent {
  message: string;
  tips: string[];
}

/**
 * Get age-appropriate nail trimming learning content
 */
export function getNailTrimmingLearningContent(
  ageDays: number,
): LearningContent {
  // 0-30 days (first month)
  if (ageDays <= 30) {
    return {
      message:
        'Newborn nails grow quickly and can scratch delicate skin. Trim 1-2 times per week, preferably after bath when nails are soft.',
      tips: [
        'Use baby nail clippers or scissors',
        'Trim after bath when nails are soft',
        'File rough edges gently',
        'Can trim while baby sleeps',
      ],
    };
  }

  // 31-180 days (1-6 months)
  if (ageDays <= 180) {
    return {
      message:
        'Baby nails continue to grow quickly. Trim 2-3 times per week to prevent scratching. Toenails grow slower than fingernails.',
      tips: [
        'Trim fingernails more frequently',
        'Toenails need trimming less often',
        'Keep clippers sanitized',
        'Trim straight across to prevent ingrowns',
      ],
    };
  }

  // 181+ days (6+ months)
  return {
    message:
      'Continue regular nail trimming 2-3 times per week. As your child gets older, you can start teaching them about nail care.',
    tips: [
      'Make it a regular routine',
      'Let toddlers watch you trim your nails',
      'Use distraction during trimming',
      'Praise cooperation',
    ],
  };
}
