interface LearningContent {
  message: string;
  tips: string[];
}

/**
 * Get age-appropriate tummy time learning content
 */
export function getTummyTimeLearningContent(ageDays: number): LearningContent {
  // 0-30 days (first month)
  if (ageDays <= 30) {
    return {
      message:
        'Start tummy time early! Even just a few minutes a day helps build neck and shoulder strength. Begin with very short sessions.',
      tips: [
        'Start with 1-2 minutes, 2-3 times daily',
        'Do it when baby is awake and alert',
        'Place baby on your chest for bonding',
        'Always supervise closely',
      ],
    };
  }

  // 31-90 days (1-3 months)
  if (ageDays <= 90) {
    return {
      message:
        'Tummy time is crucial for developing head control and strengthening muscles needed for rolling and crawling. Gradually increase duration.',
      tips: [
        'Aim for 3-5 minutes, 3-4 times daily',
        'Place toys within reach to encourage lifting head',
        'Get down at eye level to encourage',
        'Try after diaper changes when baby is alert',
      ],
    };
  }

  // 91-180 days (3-6 months)
  if (ageDays <= 180) {
    return {
      message:
        'Your baby is getting stronger! Tummy time now helps prepare for rolling over and supports overall motor development.',
      tips: [
        'Increase to 15-30 minutes total per day',
        'Baby may start pushing up on arms',
        'Use toys and mirrors to encourage engagement',
        'Watch for signs baby is ready to roll',
      ],
    };
  }

  // 181-365 days (6-12 months)
  if (ageDays <= 365) {
    return {
      message:
        'Tummy time continues to build core strength needed for crawling and sitting. Many babies are now mobile, so supervised floor time is important.',
      tips: [
        'Continue supervised floor time',
        'Encourage crawling and exploration',
        'Provide safe space to move',
        'Support development of mobility skills',
      ],
    };
  }

  // 365+ days (1+ years)
  return {
    message:
      'Toddlers benefit from active play and floor time. Encourage movement, crawling, and exploration to support physical development.',
    tips: [
      'Encourage active movement and play',
      'Provide safe spaces for exploration',
      'Support climbing and gross motor skills',
      'Make it fun and engaging',
    ],
  };
}
