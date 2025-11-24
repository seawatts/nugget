export interface QuickButton {
  icon: string;
  label: string;
  value: string;
  description: string;
}

export interface WhatsNextItem {
  title: string;
  description: string;
  timeframe: string;
}

export interface LearningContent {
  message: string;
  tips: string[];
  quickButtons?: QuickButton[];
  whatsNext?: WhatsNextItem[];
}

// Diaper quick buttons are the same across all ages
const DIAPER_QUICK_BUTTONS: QuickButton[] = [
  {
    description: 'Logs a wet-only diaper',
    icon: 'droplet',
    label: 'Quick Pee',
    value: 'Wet',
  },
  {
    description: 'Logs a dirty-only diaper',
    icon: 'zap',
    label: 'Quick Poop',
    value: 'Dirty',
  },
  {
    description: 'Logs a combination diaper',
    icon: 'sparkles',
    label: 'Quick Both',
    value: 'Both',
  },
];

/**
 * Get age-appropriate diaper learning content
 */
export function getDiaperLearningContent(
  ageDays: number,
  babyName?: string,
): LearningContent {
  const name = babyName || 'Baby';
  // 0-7 days
  if (ageDays <= 7) {
    return {
      message: `Newborns typically need 8-12 diaper changes per day. We predict based on feeding patterns and typical 2-3 hour intervals.\n\nNewborns should have at least 1 wet diaper per day of life (day 1 = 1 wet, day 2 = 2 wet, etc.) up to 6+ wet diapers by day 5-7. Tracking diaper output helps ensure ${name} is getting enough milk and staying hydrated.`,
      quickButtons: DIAPER_QUICK_BUTTONS,
      tips: [
        'Check after each feeding',
        'Count wet/dirty diapers',
        'Contact doctor if fewer than 6 wet diapers',
      ],
      whatsNext: [
        {
          description:
            'Output stabilizes to 6-8 changes daily. Bowel movements become less frequent but larger.',
          timeframe: 'Week 2',
          title: 'Pattern stabilization',
        },
        {
          description:
            'Diaper frequency may decrease to 4-6 per day. Breastfed babies may have fewer but larger bowel movements.',
          timeframe: 'Weeks 3-4',
          title: 'Frequency decreases',
        },
      ],
    };
  }

  // 8-14 days
  if (ageDays <= 14) {
    return {
      message:
        'Output stabilizes to 6-8 changes daily. Predictions use recent patterns plus time since last feeding.\n\nBy week 2, babies typically have 6-8 wet diapers per day and 3-4 dirty diapers. Bowel movements become less frequent but larger as the digestive system matures.',
      quickButtons: DIAPER_QUICK_BUTTONS,
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
      message: `Diaper frequency may decrease to 4-6 per day. We analyze ${name}'s unique timing and feeding correlation.\n\nWeeks 3-4 often see fewer but larger bowel movements (sometimes as few as 1 per day for breastfed babies). Continue to expect 6+ wet diapers daily. Patterns become more predictable.`,
      quickButtons: DIAPER_QUICK_BUTTONS,
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
        'Most babies need 5-7 changes daily. Our predictions combine bowel patterns with feeding schedules.\n\nMonths 1-2 show established patterns. Breastfed babies may go several days between bowel movements (normal if stools are soft). Formula-fed babies typically go 1-2 times daily. Wet diaper count remains steady at 6-8 per day.',
      quickButtons: DIAPER_QUICK_BUTTONS,
      tips: [
        'Bowel movements may decrease',
        'Watch for discomfort signs',
        'Maintain diaper-free time',
      ],
    };
  }

  // 61+ days
  return {
    message: `Expect 4-6 changes per day. We use ${name}'s established patterns for accurate predictions.\n\nBy 2+ months, diaper patterns are well-established and predictable. Wet diaper frequency stays steady. Bowel movement frequency varies: breastfed babies range from multiple times daily to once every 7-10 days (both normal with soft stools).`,
    quickButtons: DIAPER_QUICK_BUTTONS,
    tips: [
      'Bowel movements may decrease',
      'Watch for discomfort signs',
      'Maintain diaper-free time',
    ],
  };
}
