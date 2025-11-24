/**
 * Prediction Blending Utility
 *
 * Blends custom user preferences with recent activity data and age-based defaults
 * using a weighted average approach. This allows users to influence predictions
 * while still benefiting from historical data and developmental guidelines.
 */

export interface PreferenceBlendOptions {
  customValue: number | null | undefined;
  recentValue: number | null | undefined;
  ageBasedValue: number;
  customWeight?: number; // Default 0.4
  recentWeight?: number; // Default 0.4
  ageBasedWeight?: number; // Default 0.2
}

export interface BlendResult {
  value: number;
  source: 'custom' | 'recent' | 'age-based' | 'blended';
  breakdown: {
    custom: { value: number | null; weight: number; contribution: number };
    recent: { value: number | null; weight: number; contribution: number };
    ageBased: { value: number; weight: number; contribution: number };
  };
}

/**
 * Blends prediction values from multiple sources using weighted averaging
 *
 * Algorithm:
 * 1. If a source value is null/undefined, redistribute its weight proportionally to other sources
 * 2. Calculate weighted average of available values
 * 3. Return the blended value with breakdown for transparency
 *
 * @example
 * ```ts
 * const result = blendPredictionValues({
 *   customValue: 150, // User prefers 150ml
 *   recentValue: 140, // Recent average is 140ml
 *   ageBasedValue: 120, // Age-based default is 120ml
 * });
 * // result.value = (150 * 0.4) + (140 * 0.4) + (120 * 0.2) = 140ml
 * ```
 */
export function blendPredictionValues(
  options: PreferenceBlendOptions,
): BlendResult {
  const {
    customValue,
    recentValue,
    ageBasedValue,
    customWeight = 0.4,
    recentWeight = 0.4,
    ageBasedWeight = 0.2,
  } = options;

  // Determine which sources are available
  const hasCustom = customValue !== null && customValue !== undefined;
  const hasRecent = recentValue !== null && recentValue !== undefined;
  const hasAgeBased = true; // Age-based always has a value

  // If only custom value is set, use it directly
  if (hasCustom && !hasRecent) {
    return {
      breakdown: {
        ageBased: {
          contribution: 0,
          value: ageBasedValue,
          weight: 0,
        },
        custom: {
          contribution: customValue,
          value: customValue,
          weight: 1,
        },
        recent: {
          contribution: 0,
          value: recentValue ?? null,
          weight: 0,
        },
      },
      source: 'custom',
      value: customValue,
    };
  }

  // If no custom or recent, use age-based
  if (!hasCustom && !hasRecent) {
    return {
      breakdown: {
        ageBased: {
          contribution: ageBasedValue,
          value: ageBasedValue,
          weight: 1,
        },
        custom: {
          contribution: 0,
          value: null,
          weight: 0,
        },
        recent: {
          contribution: 0,
          value: null,
          weight: 0,
        },
      },
      source: 'age-based',
      value: ageBasedValue,
    };
  }

  // Calculate adjusted weights by redistributing missing source weights
  let adjustedCustomWeight = customWeight;
  let adjustedRecentWeight = recentWeight;
  let adjustedAgeBasedWeight = ageBasedWeight;

  // Redistribute weights proportionally when sources are missing
  if (!hasCustom) {
    // Redistribute custom weight to recent and age-based proportionally
    const totalOtherWeight = recentWeight + ageBasedWeight;
    if (totalOtherWeight > 0) {
      adjustedRecentWeight += customWeight * (recentWeight / totalOtherWeight);
      adjustedAgeBasedWeight +=
        customWeight * (ageBasedWeight / totalOtherWeight);
    }
    adjustedCustomWeight = 0;
  }

  if (!hasRecent) {
    // Redistribute recent weight to custom and age-based proportionally
    const totalOtherWeight = adjustedCustomWeight + adjustedAgeBasedWeight;
    if (totalOtherWeight > 0) {
      adjustedCustomWeight +=
        adjustedRecentWeight * (adjustedCustomWeight / totalOtherWeight);
      adjustedAgeBasedWeight +=
        adjustedRecentWeight * (adjustedAgeBasedWeight / totalOtherWeight);
    }
    adjustedRecentWeight = 0;
  }

  // Calculate weighted average
  let weightedSum = 0;
  let totalWeight = 0;

  if (hasCustom && customValue !== null) {
    weightedSum += customValue * adjustedCustomWeight;
    totalWeight += adjustedCustomWeight;
  }

  if (hasRecent && recentValue !== null) {
    weightedSum += recentValue * adjustedRecentWeight;
    totalWeight += adjustedRecentWeight;
  }

  if (hasAgeBased) {
    weightedSum += ageBasedValue * adjustedAgeBasedWeight;
    totalWeight += adjustedAgeBasedWeight;
  }

  // Calculate final blended value
  const blendedValue =
    totalWeight > 0 ? weightedSum / totalWeight : ageBasedValue;

  // Determine primary source (highest weighted contribution)
  const customContribution =
    hasCustom && customValue ? customValue * adjustedCustomWeight : 0;
  const recentContribution =
    hasRecent && recentValue ? recentValue * adjustedRecentWeight : 0;
  const ageBasedContribution = ageBasedValue * adjustedAgeBasedWeight;

  let source: 'custom' | 'recent' | 'age-based' | 'blended' = 'blended';
  if (
    customContribution > recentContribution &&
    customContribution > ageBasedContribution
  ) {
    source = 'custom';
  } else if (recentContribution > ageBasedContribution) {
    source = 'recent';
  } else if (!hasCustom && !hasRecent) {
    source = 'age-based';
  }

  return {
    breakdown: {
      ageBased: {
        contribution: ageBasedContribution,
        value: ageBasedValue,
        weight: adjustedAgeBasedWeight,
      },
      custom: {
        contribution: customContribution,
        value: customValue ?? null,
        weight: adjustedCustomWeight,
      },
      recent: {
        contribution: recentContribution,
        value: recentValue ?? null,
        weight: adjustedRecentWeight,
      },
    },
    source,
    value: Math.round(blendedValue),
  };
}

/**
 * Helper to format blend result for display
 */
export function formatBlendSource(result: BlendResult): string {
  const { source, breakdown } = result;

  if (source === 'custom') {
    return 'Based on your preference';
  }
  if (source === 'recent') {
    return 'Based on recent activity';
  }
  if (source === 'age-based') {
    return "Based on baby's age";
  }

  // Blended - show which sources contributed
  const sources = [];
  if (breakdown.custom.weight > 0) sources.push('your preference');
  if (breakdown.recent.weight > 0) sources.push('recent activity');
  if (breakdown.ageBased.weight > 0) sources.push('age guidelines');

  return `Blend of ${sources.join(', ')}`;
}
