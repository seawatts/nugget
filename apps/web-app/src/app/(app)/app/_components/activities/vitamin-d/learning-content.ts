interface LearningContent {
  message: string;
  tips: string[];
}

/**
 * Get age-appropriate vitamin D learning content
 */
export function getVitaminDLearningContent(ageDays: number): LearningContent {
  // 0-30 days (first month)
  if (ageDays <= 30) {
    return {
      message:
        'The AAP recommends 400 IU of vitamin D daily for all breastfed and partially breastfed infants starting shortly after birth. This helps prevent rickets and supports healthy bone development.',
      tips: [
        'Start vitamin D within first few days',
        'Give daily, preferably at same time',
        'Use dropper or spray as directed',
        'Can be given during or after feeding',
      ],
    };
  }

  // 31-90 days (1-3 months)
  if (ageDays <= 90) {
    return {
      message:
        'Continue daily vitamin D supplementation throughout the first year and beyond. Consistent daily dosing helps maintain optimal vitamin D levels for bone health and immune function.',
      tips: [
        'Make it part of daily routine',
        'Track to ensure consistency',
        'Breastfed babies need supplementation',
        'Formula-fed may need less (check with pediatrician)',
      ],
    };
  }

  // 91-180 days (3-6 months)
  if (ageDays <= 180) {
    return {
      message:
        'As your baby grows, vitamin D remains essential for calcium absorption and bone development. Continue supplementation even as feeding patterns change.',
      tips: [
        'Continue daily supplementation',
        'Discuss dosage at well-visits',
        'Track to build healthy habits',
        'Can mix with small amount of breast milk or formula',
      ],
    };
  }

  // 181-365 days (6-12 months)
  if (ageDays <= 365) {
    return {
      message:
        'Vitamin D supplementation should continue through the first year and beyond, especially for breastfed babies. Even with the introduction of solids, supplementation remains important.',
      tips: [
        'Maintain daily supplementation',
        'Some foods contain vitamin D (egg yolks, fortified cereals)',
        'Still need supplement even with solids',
        'Discuss ongoing needs with pediatrician',
      ],
    };
  }

  // 365+ days (1+ years)
  return {
    message:
      'Toddlers need 600 IU of vitamin D daily. Continue supplementation, especially if your child drinks less than 32 oz of vitamin D-fortified milk daily or has limited sun exposure.',
    tips: [
      'Continue supplementation into toddlerhood',
      'Some children need vitamin D into childhood',
      'Sunscreen blocks vitamin D production',
      'Discuss with pediatrician at annual checkups',
    ],
  };
}
