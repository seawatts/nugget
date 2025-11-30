'use client';

import type { Activities } from '@nugget/db/schema';
import { Badge } from '@nugget/ui/badge';
import { Card } from '@nugget/ui/card';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import {
  type ActivitySleepCorrelation,
  getActivitySleepCorrelations,
  getOptimalActivityTiming,
} from '../activity-sleep-correlation';

interface ActivitySleepInsightsProps {
  activities: Array<typeof Activities.$inferSelect>;
  babyBirthDate: Date | null;
}

export function ActivitySleepInsights({
  activities,
  babyBirthDate,
}: ActivitySleepInsightsProps) {
  const correlations = getActivitySleepCorrelations(activities);
  const optimalTimings = getOptimalActivityTiming(activities, babyBirthDate);

  // Group correlations by impact
  const positiveCorrelations = correlations.filter(
    (c) => c.impact === 'positive',
  );
  const negativeCorrelations = correlations.filter(
    (c) => c.impact === 'negative',
  );

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-foreground">
          Activity-Sleep Insights
        </h3>
        <p className="text-xs text-muted-foreground">
          How activities affect your baby's sleep quality
        </p>
      </div>

      <div className="space-y-6">
        {/* Positive Correlations */}
        {positiveCorrelations.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
              <h4 className="text-sm font-medium text-foreground">
                Activities That Help Sleep
              </h4>
            </div>
            <div className="space-y-2">
              {positiveCorrelations.slice(0, 3).map((correlation) => (
                <ActivityInsightItem
                  correlation={correlation}
                  key={correlation.activityType}
                />
              ))}
            </div>
          </div>
        )}

        {/* Negative Correlations */}
        {negativeCorrelations.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <AlertCircle className="size-4 text-orange-600 dark:text-orange-400" />
              <h4 className="text-sm font-medium text-foreground">
                Activities That May Disrupt Sleep
              </h4>
            </div>
            <div className="space-y-2">
              {negativeCorrelations.slice(0, 3).map((correlation) => (
                <ActivityInsightItem
                  correlation={correlation}
                  key={correlation.activityType}
                />
              ))}
            </div>
          </div>
        )}

        {/* Optimal Timing Recommendations */}
        {optimalTimings.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Info className="size-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-medium text-foreground">
                Optimal Activity Timing
              </h4>
            </div>
            <div className="space-y-3">
              {optimalTimings.map((timing) => (
                <ActivityTimingItem key={timing.activityType} timing={timing} />
              ))}
            </div>
          </div>
        )}

        {/* No Insights Message */}
        {correlations.length === 0 && optimalTimings.length === 0 && (
          <div className="rounded-lg border bg-muted/50 p-4 text-center">
            <Info className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Track more activities and sleep to see insights
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

function ActivityInsightItem({
  correlation,
}: {
  correlation: ActivitySleepCorrelation;
}) {
  const activityName = formatActivityName(correlation.activityType);
  const confidenceColors = {
    high: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    medium:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {activityName}
            </p>
            <Badge
              className={confidenceColors[correlation.confidence]}
              variant="secondary"
            >
              {correlation.confidence}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {correlation.insight}
          </p>
        </div>
      </div>
    </div>
  );
}

function ActivityTimingItem({
  timing,
}: {
  timing: ReturnType<typeof getOptimalActivityTiming>[number];
}) {
  const activityName = formatActivityName(timing.activityType);

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <h5 className="text-sm font-medium text-foreground">{activityName}</h5>

      {timing.recommendedWindows.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-foreground">
            Recommended Times:
          </p>
          <ul className="mt-1 space-y-1">
            {timing.recommendedWindows.map((window) => (
              <li
                className="text-xs text-muted-foreground"
                key={`${window.hours}-${window.reasoning}`}
              >
                •{' '}
                <span className="font-medium text-foreground">
                  {window.hours}
                </span>{' '}
                - {window.reasoning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {timing.avoidWindows.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-foreground">Avoid:</p>
          <ul className="mt-1 space-y-1">
            {timing.avoidWindows.map((window) => (
              <li
                className="text-xs text-muted-foreground"
                key={`${window.hours}-${window.reasoning}`}
              >
                •{' '}
                <span className="font-medium text-foreground">
                  {window.hours}
                </span>{' '}
                - {window.reasoning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatActivityName(activityType: string): string {
  const names: Record<string, string> = {
    bath: 'Bath',
    both: 'Diaper Change (Both)',
    bottle: 'Bottle',
    diaper: 'Diaper Change',
    dirty: 'Diaper Change (Dirty)',
    feeding: 'Feeding',
    medicine: 'Medicine',
    nursing: 'Nursing',
    solids: 'Solids',
    temperature: 'Temperature Check',
    tummy_time: 'Tummy Time',
    wet: 'Diaper Change (Wet)',
  };

  return (
    names[activityType] ||
    activityType.charAt(0).toUpperCase() +
      activityType.slice(1).replace(/_/g, ' ')
  );
}
