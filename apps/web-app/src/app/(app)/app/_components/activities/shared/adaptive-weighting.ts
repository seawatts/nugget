/**
 * Calculate adaptive weight for combining age-based and prediction-based intervals
 * Gradually increases confidence in user patterns as more data is collected
 *
 * @param dataPointsCount - Number of recent activities used in prediction
 * @returns Object with ageWeight and predictionWeight (sum to 1.0)
 */
export function calculateAdaptiveWeights(dataPointsCount: number): {
  ageWeight: number;
  predictionWeight: number;
} {
  // With 0-5 data points: 100% age-based (not enough data yet)
  if (dataPointsCount <= 5) {
    return { ageWeight: 1.0, predictionWeight: 0.0 };
  }

  // With 6-10 data points: 70% age-based, 30% predicted (starting to learn)
  if (dataPointsCount <= 10) {
    return { ageWeight: 0.7, predictionWeight: 0.3 };
  }

  // With 11-20 data points: 50% age-based, 50% predicted (balanced)
  if (dataPointsCount <= 20) {
    return { ageWeight: 0.5, predictionWeight: 0.5 };
  }

  // With 21+ data points: 30% age-based, 70% predicted (confident in patterns)
  return { ageWeight: 0.3, predictionWeight: 0.7 };
}

/**
 * Calculate weighted interval combining age-based and prediction-based intervals
 *
 * @param ageBasedInterval - Interval based on baby's age (hours)
 * @param predictedInterval - Interval from prediction algorithm (hours)
 * @param dataPointsCount - Number of recent activities used in prediction
 * @returns Weighted interval in hours
 */
export function calculateWeightedInterval(
  ageBasedInterval: number,
  predictedInterval: number | null,
  dataPointsCount: number,
): number {
  // If no prediction data, use age-based only
  if (predictedInterval === null) {
    return ageBasedInterval;
  }

  const { ageWeight, predictionWeight } =
    calculateAdaptiveWeights(dataPointsCount);

  return ageBasedInterval * ageWeight + predictedInterval * predictionWeight;
}
