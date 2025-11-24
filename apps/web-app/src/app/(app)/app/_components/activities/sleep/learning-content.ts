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

// Sleep quick buttons are the same across all ages
const SLEEP_QUICK_BUTTONS: QuickButton[] = [
  {
    description: 'Logs a completed 1-hour sleep session',
    icon: 'moon',
    label: '1 Hour',
    value: '1h',
  },
  {
    description: 'Logs a completed 2-hour sleep session',
    icon: 'moon',
    label: '2 Hours',
    value: '2h',
  },
  {
    description: 'Begins real-time tracking for ongoing sleep',
    icon: 'smartphone',
    label: 'Start Timer',
    value: 'Live',
  },
];

/**
 * Get age-appropriate sleep learning content
 */
export function getSleepLearningContent(
  ageDays: number,
  babyName?: string,
): LearningContent {
  const name = babyName || 'Baby';
  // 0-7 days
  if (ageDays <= 7) {
    return {
      message:
        'Newborns sleep 16-18 hours per day in short bursts. We predict wake times based on typical 1-2 hour cycles.\n\nNewborn sleep is irregular with no day/night distinction yet. These buttons cover typical sleep segment lengths. The app automatically categorizes as nap (6am-6pm) or night sleep (6pm-6am).',
      quickButtons: SLEEP_QUICK_BUTTONS,
      tips: ['Safe sleep on back', 'Dark quiet room', 'Watch for sleepy cues'],
      whatsNext: [
        {
          description:
            'Sleep patterns begin forming. Wake windows extend slightly to 60-90 minutes between naps.',
          timeframe: 'Week 2',
          title: 'Early patterns emerge',
        },
        {
          description:
            'Day/night distinction starts developing. Night sleep may consolidate into slightly longer stretches.',
          timeframe: 'Weeks 3-4',
          title: 'Circadian rhythm develops',
        },
      ],
    };
  }

  // 8-14 days
  if (ageDays <= 14) {
    return {
      message: `Sleep patterns are forming. Predictions use ${name}'s recent naps plus expected wake windows for this age.\n\nWeek 2 babies typically have 45-minute to 2-hour sleep stretches. Total sleep: 15-17 hours daily. Wake windows are still short (60-90 minutes). The app uses time of day to categorize naps vs. night sleep automatically.`,
      quickButtons: SLEEP_QUICK_BUTTONS,
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
      message: `${name}'s wake windows extend to 1-2 hours. We analyze sleep/wake patterns to predict the next nap.\n\nWeeks 3-4 bring slightly longer wake windows (60-90 minutes) and more consolidated sleep. Total daily sleep: 14-17 hours. Babies begin showing early signs of day/night distinction. Naps may start following a loose pattern.`,
      quickButtons: SLEEP_QUICK_BUTTONS,
      tips: [
        'Watch for wake windows',
        'Consistent bedtime routine',
        'Track nap duration',
      ],
    };
  }

  // 31-60 days
  if (ageDays <= 60) {
    return {
      message: `Longer sleep stretches emerge. Our predictions combine ${name}'s pattern with typical 2-3 hour wake windows.\n\nMonths 1-2 show developing sleep consolidation. Total sleep: 14-16 hours daily. Wake windows extend to 60-120 minutes. Night sleep may reach 4-6 hour stretches. Most babies take 4-5 naps per day.`,
      quickButtons: SLEEP_QUICK_BUTTONS,
      tips: [
        'Maintain consistent bedtimes',
        'Room dark and quiet',
        'Track patterns over time',
      ],
    };
  }

  // 61+ days
  return {
    message: `Sleep consolidates into longer periods. We use ${name}'s established rhythm for predictions.\n\nBy 2+ months, sleep becomes more organized. Total sleep: 14-16 hours daily. Wake windows: 75-120 minutes. Night sleep may extend to 6-8 hours. Naps consolidate to 3-4 per day with more predictable timing. Clear day/night distinction develops.`,
    quickButtons: SLEEP_QUICK_BUTTONS,
    tips: [
      'Maintain consistent bedtimes',
      'Room dark and quiet',
      'Track patterns over time',
    ],
  };
}
