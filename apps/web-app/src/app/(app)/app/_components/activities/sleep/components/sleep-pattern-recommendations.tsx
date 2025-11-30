'use client';

import type { Activities } from '@nugget/db/schema';
import { Card } from '@nugget/ui/card';
import { Clock, Moon, Sun, TrendingUp } from 'lucide-react';
import { formatTimeWithPreference } from '~/lib/format-time';
import {
  analyzeOptimalBedtime,
  analyzeOptimalWakeTime,
  calculateWakeWindows,
} from '../sleep-pattern-analysis';

interface SleepPatternRecommendationsProps {
  activities: Array<typeof Activities.$inferSelect>;
  babyBirthDate: Date | null;
  timeFormat: '12h' | '24h';
}

export function SleepPatternRecommendations({
  activities,
  babyBirthDate,
  timeFormat,
}: SleepPatternRecommendationsProps) {
  const wakeTimeResult = analyzeOptimalWakeTime(activities, babyBirthDate);
  const bedtimeResult = analyzeOptimalBedtime(activities, babyBirthDate);
  const wakeWindowsResult = calculateWakeWindows(activities, babyBirthDate);

  const confidenceColors = {
    high: 'text-green-600 dark:text-green-400',
    low: 'text-gray-500 dark:text-gray-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
  };

  const confidenceLabels = {
    high: 'High confidence',
    low: 'Low confidence',
    medium: 'Medium confidence',
  };

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-foreground">
          Sleep Pattern Recommendations
        </h3>
        <p className="text-xs text-muted-foreground">
          Based on your baby's sleep patterns and age
        </p>
      </div>

      <div className="space-y-4">
        {/* Optimal Wake Time */}
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
            <Sun className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-foreground">
                Optimal Wake Time
              </h4>
              <span
                className={`text-xs ${confidenceColors[wakeTimeResult.confidence]}`}
              >
                {confidenceLabels[wakeTimeResult.confidence]}
              </span>
            </div>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatTimeWithPreference(
                wakeTimeResult.recommendedTime,
                timeFormat,
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {wakeTimeResult.reasoning}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Typical range:{' '}
              {formatTimeWithPreference(
                wakeTimeResult.typicalRange.start,
                timeFormat,
              )}{' '}
              -{' '}
              {formatTimeWithPreference(
                wakeTimeResult.typicalRange.end,
                timeFormat,
              )}
            </p>
          </div>
        </div>

        {/* Optimal Bedtime */}
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
            <Moon className="size-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-foreground">
                Optimal Bedtime
              </h4>
              <span
                className={`text-xs ${confidenceColors[bedtimeResult.confidence]}`}
              >
                {confidenceLabels[bedtimeResult.confidence]}
              </span>
            </div>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatTimeWithPreference(
                bedtimeResult.recommendedTime,
                timeFormat,
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {bedtimeResult.reasoning}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Typical range:{' '}
              {formatTimeWithPreference(
                bedtimeResult.typicalRange.start,
                timeFormat,
              )}{' '}
              -{' '}
              {formatTimeWithPreference(
                bedtimeResult.typicalRange.end,
                timeFormat,
              )}
            </p>
          </div>
        </div>

        {/* Wake Windows */}
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900/30">
            <Clock className="size-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-foreground">
                Recommended Wake Window
              </h4>
              <span
                className={`text-xs ${confidenceColors[wakeWindowsResult.confidence]}`}
              >
                {confidenceLabels[wakeWindowsResult.confidence]}
              </span>
            </div>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {Math.round((wakeWindowsResult.windowMinutes / 60) * 10) / 10}{' '}
              hours
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {wakeWindowsResult.reasoning}
            </p>
          </div>
        </div>

        {/* Suggested Schedule Summary */}
        {wakeTimeResult.confidence !== 'low' &&
          bedtimeResult.confidence !== 'low' && (
            <div className="mt-4 rounded-lg border bg-muted/50 p-3">
              <div className="flex items-start gap-2">
                <TrendingUp className="mt-0.5 size-4 text-muted-foreground" />
                <div className="flex-1">
                  <h5 className="text-xs font-medium text-foreground">
                    Suggested Daily Schedule
                  </h5>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Based on your baby's patterns, aim for:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <li>
                      • Wake up around{' '}
                      <span className="font-medium text-foreground">
                        {formatTimeWithPreference(
                          wakeTimeResult.recommendedTime,
                          timeFormat,
                        )}
                      </span>
                    </li>
                    <li>
                      • Stay awake for about{' '}
                      <span className="font-medium text-foreground">
                        {Math.round(
                          (wakeWindowsResult.windowMinutes / 60) * 10,
                        ) / 10}{' '}
                        hours
                      </span>{' '}
                      between sleeps
                    </li>
                    <li>
                      • Bedtime around{' '}
                      <span className="font-medium text-foreground">
                        {formatTimeWithPreference(
                          bedtimeResult.recommendedTime,
                          timeFormat,
                        )}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
      </div>
    </Card>
  );
}
