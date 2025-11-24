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

/**
 * Get age-appropriate feeding learning content
 */
export function getFeedingLearningContent(
  ageDays: number,
  babyName?: string,
): LearningContent {
  const name = babyName || 'Baby';
  // 0-7 days
  if (ageDays <= 7) {
    const bottleAmount = ageDays <= 2 ? '1.5oz (45ml)' : '2.5oz (75ml)';
    const bottleContext =
      ageDays <= 2
        ? 'Stomach capacity is very small (5-7ml), feedings are frequent but tiny amounts.'
        : 'Stomach is expanding (22-27ml by day 3, 43-47ml by day 7), milk intake increases.';
    const ageContext = ageDays <= 2 ? 'days 0-2' : 'days 3-7';

    return {
      message: `Newborns have tiny stomachs and need frequent feeding. We predict based on typical 2-3 hour intervals for this age.\n\nThese values are age-appropriate baseline amounts. Actual intake varies by ${name.toLowerCase()}, feeding method, and whether ${name.toLowerCase()} is breastfed or formula-fed.`,
      quickButtons: [
        {
          description: bottleContext,
          icon: 'baby',
          label: 'Quick Bottle',
          value: bottleAmount,
        },
        {
          description: `Typical newborn nursing duration for ${ageContext}, allowing time for both breasts and proper milk transfer.`,
          icon: 'clock',
          label: 'Quick Nursing',
          value: '30 min',
        },
      ],
      tips: [
        'Watch for hunger cues',
        'Feed on demand even at night',
        'Track wet/dirty diapers',
      ],
      whatsNext: [
        {
          description: `Stomach capacity grows rapidly. Expect slightly longer intervals between feeds as ${name} takes more per session.`,
          timeframe: 'Week 2',
          title: 'Feeding intervals extend',
        },
        {
          description: `Transitional milk becomes mature milk. Output increases and ${name} may show early signs of a feeding pattern.`,
          timeframe: 'Days 8-14',
          title: 'Milk matures & patterns emerge',
        },
      ],
    };
  }

  // 8-14 days
  if (ageDays <= 14) {
    return {
      message: `${name} is establishing a feeding rhythm. Predictions use ${name}'s recent pattern plus typical 3-hour intervals.\n\nThese values represent the developing feeding pattern in week 2. Babies are feeding less frequently but taking larger amounts as their stomach grows.`,
      quickButtons: [
        {
          description:
            'Typical intake for week 2 when stomach capacity is ~60-90ml per feeding.',
          icon: 'baby',
          label: 'Quick Bottle',
          value: '3oz (90ml)',
        },
        {
          description:
            'Average nursing time as baby becomes more efficient at milk transfer.',
          icon: 'clock',
          label: 'Quick Nursing',
          value: '25 min',
        },
      ],
      tips: [
        'Look for a consistent pattern',
        'Note feeding duration',
        'Stay flexible with timing',
      ],
      whatsNext: [
        {
          description: `${name} begins spacing feedings to 3-4 hours. The stomach can hold 90-120ml, allowing for more substantial meals.`,
          timeframe: 'Weeks 3-4',
          title: 'Longer stretches between feeds',
        },
        {
          description:
            'Predictable schedules start forming. Night feeds may consolidate slightly, giving you longer sleep windows.',
          timeframe: 'By 1 month',
          title: 'Schedule becomes more regular',
        },
      ],
    };
  }

  // 15-30 days
  if (ageDays <= 30) {
    return {
      message: `${name} may start spacing feedings to 3-4 hours. We analyze ${name}'s unique pattern to predict the next feeding.\n\nThese amounts reflect the natural progression from newborn to month-old feeding patterns. Babies typically establish more predictable schedules during this period.`,
      quickButtons: [
        {
          description:
            'Standard intake for weeks 3-4 when stomach capacity is ~90-120ml.',
          icon: 'baby',
          label: 'Quick Bottle',
          value: '4oz (120ml)',
        },
        {
          description:
            "Efficient nursing duration as baby's sucking becomes stronger.",
          icon: 'clock',
          label: 'Quick Nursing',
          value: '25 min',
        },
      ],
      tips: [
        "Trust your baby's signals",
        'Keep tracking for patterns',
        'Consult pediatrician if concerned',
      ],
      whatsNext: [
        {
          description:
            'Most babies settle into 4-hour feeding schedules. Night sleep may extend to 4-6 hour stretches.',
          timeframe: 'Months 1-2',
          title: 'Established 4-hour routine',
        },
        {
          description: `${name} becomes more efficient at nursing. Sessions may shorten while intake stays consistent or increases.`,
          timeframe: 'By 2 months',
          title: 'Faster, more efficient feeding',
        },
      ],
    };
  }

  // 31-60 days
  if (ageDays <= 60) {
    return {
      message: `Most babies settle into a 4-hour schedule. Our predictions combine ${name}'s history with age-appropriate intervals.\n\nThese values represent the established feeding pattern for 1-2 month olds. Babies are taking larger volumes less frequently and nursing more efficiently.`,
      quickButtons: [
        {
          description:
            'Typical intake for 1-2 months when stomach capacity is ~120-150ml.',
          icon: 'baby',
          label: 'Quick Bottle',
          value: '5oz (150ml)',
        },
        {
          description:
            "More efficient nursing as baby's feeding skills improve.",
          icon: 'clock',
          label: 'Quick Nursing',
          value: '20 min',
        },
      ],
      tips: [
        "Trust your baby's signals",
        'Keep tracking for patterns',
        'Consult pediatrician if concerned',
      ],
      whatsNext: [
        {
          description: `Feedings extend to 4-5 hours apart. ${name} takes 6-8oz per bottle or nurses in 15-20 efficient minutes.`,
          timeframe: 'Months 2-3',
          title: 'Longer intervals, efficient feeds',
        },
        {
          description: `Introduction to solids approaches. Most pediatricians recommend starting around 4-6 months when ${name} shows readiness.`,
          timeframe: 'By 4-6 months',
          title: 'Solid foods on the horizon',
        },
      ],
    };
  }

  // 61+ days
  return {
    message: `Feedings typically occur every 4-5 hours. We use ${name}'s established pattern for accurate predictions.\n\nThese values represent mature feeding patterns for babies 2 months and older. Most babies have efficient feeding skills and longer intervals between feeds. Actual amounts may vary with growth spurts.`,
    quickButtons: [
      {
        description:
          'Standard intake for 2+ months when stomach capacity is ~150-180ml.',
        icon: 'baby',
        label: 'Quick Bottle',
        value: '6oz (180ml)',
      },
      {
        description: `Very efficient nursing sessions as ${name} masters feeding.`,
        icon: 'clock',
        label: 'Quick Nursing',
        value: '15 min',
      },
    ],
    tips: [
      "Trust your baby's signals",
      'Keep tracking for patterns',
      'Consult pediatrician if concerned',
    ],
    whatsNext: [
      {
        description:
          'Solid foods become a bigger part of nutrition. Milk feeds gradually decrease as solids increase.',
        timeframe: 'Months 4-6',
        title: 'Transition to solids begins',
      },
      {
        description: `By 6-8 months, ${name} typically has 3 meals of solids plus 3-4 milk feeds. Feeding becomes more interactive.`,
        timeframe: 'By 6-8 months',
        title: 'Established meal routine',
      },
    ],
  };
}
