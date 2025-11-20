interface LearningContent {
  title: string;
  tips: string[];
}

/**
 * Get age-appropriate learning content for doctor visits
 * Based on AAP well-baby visit schedule and developmental milestones
 */
export function getDoctorVisitLearningContent(
  ageDays: number,
): LearningContent {
  // Newborn (0-7 days)
  if (ageDays <= 7) {
    return {
      tips: [
        'Your first pediatric visit typically happens 3-5 days after birth to check weight, feeding, and jaundice.',
        'Bring questions about feeding, sleeping, and any concerns from the hospital stay.',
        'The doctor will check for proper latch if breastfeeding and assess overall health.',
        'Expect a full physical exam including checking the umbilical cord and circumcision healing.',
      ],
      title: 'Newborn Checkup (3-5 days)',
    };
  }

  // 2 Week Visit
  if (ageDays <= 21) {
    return {
      tips: [
        'Weight check is crucial - babies should return to birth weight by 2 weeks.',
        'Discuss feeding patterns, diaper output, and sleep schedules.',
        'Ask about infant care basics: bathing, cord care, and safe sleep practices.',
        'Bring up any concerns about crying patterns or fussiness.',
      ],
      title: '2 Week Checkup',
    };
  }

  // 1 Month Visit
  if (ageDays <= 45) {
    return {
      tips: [
        'First month checkup focuses on growth, feeding, and development.',
        'May receive Hepatitis B vaccine if not given at birth.',
        'Doctor will assess social smiles and eye tracking.',
        'Good time to discuss postpartum recovery and parent well-being.',
      ],
      title: '1 Month Checkup',
    };
  }

  // 2 Month Visit
  if (ageDays <= 90) {
    return {
      tips: [
        'First major vaccination appointment! Baby will receive DTaP, IPV, Hib, PCV13, Rotavirus, and Hepatitis B.',
        'Bring comfort items and be prepared for fussiness after vaccines.',
        'Doctor will check head control and track developmental milestones.',
        'Discuss tummy time, sleep schedules, and introducing routines.',
        'Consider giving acetaminophen after vaccines if recommended by your doctor.',
      ],
      title: '2 Month Checkup & Vaccines',
    };
  }

  // 4 Month Visit
  if (ageDays <= 150) {
    return {
      tips: [
        'Second round of vaccinations: DTaP, IPV, Hib, PCV13, and Rotavirus.',
        'Baby should be rolling over and showing improved neck control.',
        'Discuss introduction to solid foods (usually around 6 months).',
        'Ask about sleep training methods if sleep is challenging.',
        'Teething may begin soon - discuss pain relief options.',
      ],
      title: '4 Month Checkup & Vaccines',
    };
  }

  // 6 Month Visit
  if (ageDays <= 210) {
    return {
      tips: [
        'Third round of major vaccines plus possible seasonal influenza vaccine.',
        'Baby should be sitting with support and may be starting solid foods.',
        'Discuss iron-rich foods and proper introduction of allergens.',
        'Dental care begins - wiping gums and first tooth care.',
        'Talk about baby-proofing as mobility increases.',
      ],
      title: '6 Month Checkup & Vaccines',
    };
  }

  // 9 Month Visit
  if (ageDays <= 300) {
    return {
      tips: [
        'Baby should be crawling or scooting and pulling to stand.',
        'May receive flu vaccine if in flu season.',
        'Discuss finger foods, self-feeding, and choking hazards.',
        'Separation anxiety is normal at this age.',
        'Review home safety as baby becomes more mobile.',
      ],
      title: '9 Month Checkup',
    };
  }

  // 12 Month Visit
  if (ageDays <= 395) {
    return {
      tips: [
        'First birthday visit includes MMR, Varicella, Hepatitis A, PCV13, and Hib vaccines.',
        'Baby should be taking steps or walking independently.',
        'Transition from formula to whole milk (if not breastfeeding).',
        'Discuss language development - should have a few words.',
        'Lead screening and anemia check with finger prick.',
        'Plan ahead for fewer visits in year two!',
      ],
      title: '12 Month (1 Year) Checkup',
    };
  }

  // After first year
  return {
    tips: [
      'Well-child visits continue at 15, 18, 24, and 30 months in the second year.',
      'Annual checkups are recommended after age 2.',
      'Maintain up-to-date vaccination records.',
      'Call your pediatrician between visits for any concerns.',
      'Track developmental milestones using CDC resources.',
    ],
    title: 'After First Year Checkups',
  };
}

/**
 * Get general tips for preparing for any doctor visit
 */
export function getGeneralDoctorVisitTips(): string[] {
  return [
    'Bring your insurance card and any required forms.',
    'Keep a running list of questions between visits.',
    'Undress baby to diaper before measurements for accurate weight/length.',
    'Bring extra diapers, wipes, and a change of clothes.',
    'Have baby feed before visit if possible - happy babies cooperate better.',
    'Take photos of any rashes or concerns to show the doctor.',
    'Bring your vaccination record to keep it updated.',
    'Ask about when to call between visits and after-hours care.',
  ];
}

/**
 * Get tips about vaccination schedule
 */
export function getVaccinationTips(): string[] {
  return [
    'Vaccines protect against serious and potentially deadly diseases.',
    'Multiple vaccines at once are safe and recommended by pediatricians.',
    'Mild fever and fussiness after vaccines are normal and show immunity building.',
    'Serious side effects are extremely rare.',
    'Keeping on schedule provides protection when babies are most vulnerable.',
    'Some vaccines require multiple doses for full protection.',
  ];
}
