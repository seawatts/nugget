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
 * Get age-appropriate pumping learning content
 */
export function getPumpingLearningContent(
  ageDays: number,
  babyName?: string,
): LearningContent {
  const name = babyName || 'Baby';
  // 0-7 days
  if (ageDays <= 7) {
    // Determine specific age range for more precise messaging
    if (ageDays <= 3) {
      return {
        message:
          'Early pumping helps establish milk supply. We predict pumping times based on recommended 2-3 hour intervals.\n\nThese amounts are based on typical day 0-3 output ranges when colostrum production is naturally very low. Each button logs equal amounts from both breasts.',
        quickButtons: [
          {
            description: 'Minimal output session for colostrum phase',
            icon: 'droplet',
            label: 'Low',
            value: '0.2oz (5ml)',
          },
          {
            description: 'Typical colostrum volume for days 0-3',
            icon: 'droplet',
            label: 'Medium',
            value: '0.3oz (10ml)',
          },
          {
            description: 'Good colostrum session for early days',
            icon: 'sparkles',
            label: 'High',
            value: '0.5oz (15ml)',
          },
        ],
        tips: [
          'Pump both breasts simultaneously',
          'Stay hydrated and well-fed',
          'Keep pumping for 15-20 minutes',
        ],
        whatsNext: [
          {
            description:
              'Milk transitions from colostrum to mature milk. Output increases significantly (1.5-2.5oz per session).',
            timeframe: 'Days 4-7',
            title: 'Transitional milk arrives',
          },
          {
            description:
              'Supply establishes with consistent pumping. Output stabilizes at 3-5oz per session.',
            timeframe: 'Week 2',
            title: 'Early mature milk production',
          },
        ],
      };
    }
    return {
      message:
        'Early pumping helps establish milk supply. We predict pumping times based on recommended 2-3 hour intervals.\n\nThese amounts reflect the natural increase in milk production during days 4-7 when transitional milk replaces colostrum. Values are total output split equally between breasts.',
      quickButtons: [
        {
          description: 'Light session as milk comes in',
          icon: 'droplet',
          label: 'Low',
          value: '1.5oz (45ml)',
        },
        {
          description: 'Typical transitional milk output (days 4-7)',
          icon: 'droplet',
          label: 'Medium',
          value: '2oz (60ml)',
        },
        {
          description: 'Strong session during milk transition',
          icon: 'sparkles',
          label: 'High',
          value: '2.5oz (75ml)',
        },
      ],
      tips: [
        'Pump both breasts simultaneously',
        'Stay hydrated and well-fed',
        'Keep pumping for 15-20 minutes',
      ],
      whatsNext: [
        {
          description:
            'Mature milk fully establishes. Consistent output of 3-5oz per session becomes the norm.',
          timeframe: 'Days 8-14',
          title: 'Mature milk established',
        },
        {
          description:
            'Supply builds with regular pumping schedule. Most parents reach 4-6oz per session.',
          timeframe: 'Weeks 3-4',
          title: 'Supply increases steadily',
        },
      ],
    };
  }

  // 8-14 days
  if (ageDays <= 14) {
    return {
      message:
        'Your supply is establishing. Predictions use your recent pumping pattern plus recommended intervals.\n\nThese amounts represent the range of normal output during the early mature milk phase (days 8-14) when your supply is building. Each value is the total amount pumped from both breasts combined.',
      quickButtons: [
        {
          description: 'Below average session for early mature milk',
          icon: 'droplet',
          label: 'Low',
          value: '3oz (90ml)',
        },
        {
          description: 'Typical output for week 2',
          icon: 'droplet',
          label: 'Medium',
          value: '4oz (120ml)',
        },
        {
          description: 'Above average session as supply builds',
          icon: 'sparkles',
          label: 'High',
          value: '5oz (150ml)',
        },
      ],
      tips: [
        'Pump at the same times daily',
        'Massage breasts before pumping',
        `Look at ${name}'s photos to help letdown`,
      ],
      whatsNext: [
        {
          description:
            'Supply continues building. Most parents reach 4-6oz per session with consistent pumping.',
          timeframe: 'Weeks 3-4',
          title: 'Supply establishment phase',
        },
        {
          description:
            'Mature supply stabilizes at 5-7oz per session. Your pumping rhythm becomes more predictable.',
          timeframe: 'By 1 month',
          title: 'Established supply',
        },
      ],
    };
  }

  // 15-30 days
  if (ageDays <= 30) {
    return {
      message:
        'Building supply requires consistency. We analyze your pumping rhythm to predict optimal times.\n\nThese amounts reflect typical pumping output during the supply establishment phase (days 15-30). Most parents find their output stabilizing within this range as they maintain a consistent pumping schedule.',
      quickButtons: [
        {
          description: 'Light session during supply establishment',
          icon: 'droplet',
          label: 'Low',
          value: '4oz (120ml)',
        },
        {
          description: 'Average output for weeks 3-4',
          icon: 'droplet',
          label: 'Medium',
          value: '5oz (150ml)',
        },
        {
          description: 'Strong session as supply stabilizes',
          icon: 'sparkles',
          label: 'High',
          value: '6oz (180ml)',
        },
      ],
      tips: [
        'Maintain 8 pumping sessions daily',
        'Power pump if supply is low',
        'Ensure proper flange fit',
      ],
      whatsNext: [
        {
          description:
            'Supply reaches full establishment. Output stabilizes at 5-7oz per session with consistent pumping.',
          timeframe: 'Months 1-2',
          title: 'Fully established supply',
        },
        {
          description:
            'You may reduce to 6-8 pumping sessions daily while maintaining supply. Efficiency improves.',
          timeframe: 'By 2 months',
          title: 'Sustainable pumping schedule',
        },
      ],
    };
  }

  // 31-60 days
  if (ageDays <= 60) {
    return {
      message:
        'Your supply is established. Our predictions combine your pattern with supply maintenance intervals.\n\nThese amounts represent the typical range for an established milk supply (days 31-60). At this stage, most parents have a consistent output pattern, and these buttons cover the common range of session volumes.',
      quickButtons: [
        {
          description: 'Below typical output for established supply',
          icon: 'droplet',
          label: 'Low',
          value: '5oz (150ml)',
        },
        {
          description: 'Standard output for months 1-2',
          icon: 'droplet',
          label: 'Medium',
          value: '6oz (180ml)',
        },
        {
          description: 'Above average established supply',
          icon: 'sparkles',
          label: 'High',
          value: '7oz (210ml)',
        },
      ],
      tips: [
        'Continue regular schedule',
        'Track output to monitor supply',
        'Replace pump parts regularly',
      ],
      whatsNext: [
        {
          description:
            'Supply maintains with 6-8 sessions daily. Output stays consistent at 5-7oz per session.',
          timeframe: 'Months 2-3',
          title: 'Maintained mature supply',
        },
        {
          description: `Some parents begin spacing sessions further apart. ${name} may become more efficient at nursing directly.`,
          timeframe: 'Months 3-4',
          title: 'Potential schedule adjustments',
        },
      ],
    };
  }

  // 61+ days
  return {
    message:
      'Maintaining supply with 6-8 daily sessions. We use your established pumping rhythm for predictions.\n\nThese amounts represent the stable output range for a well-established, maintained milk supply (61+ days). Your actual output may vary by time of day, stress, hydration, and other factors, but these buttons cover the typical range.',
    quickButtons: [
      {
        description: 'Lighter session for maintained supply',
        icon: 'droplet',
        label: 'Low',
        value: '5oz (150ml)',
      },
      {
        description: 'Typical output for 2+ months',
        icon: 'droplet',
        label: 'Medium',
        value: '6oz (180ml)',
      },
      {
        description: 'Strong session with maintained supply',
        icon: 'sparkles',
        label: 'High',
        value: '7oz (210ml)',
      },
    ],
    tips: [
      'Continue regular schedule',
      'Track output to monitor supply',
      'Replace pump parts regularly',
    ],
    whatsNext: [
      {
        description:
          'Many parents continue pumping for months. Supply remains stable with consistent schedule.',
        timeframe: 'Months 3-6+',
        title: 'Long-term pumping success',
      },
      {
        description:
          'When ready to wean, gradually reduce sessions over 2-4 weeks to avoid discomfort and maintain breast health.',
        timeframe: 'When weaning',
        title: 'Gradual weaning approach',
      },
    ],
  };
}
