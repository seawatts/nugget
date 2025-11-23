'use client';

import { Progress } from '@nugget/ui/progress';
import { format } from 'date-fns';
import { Clock, Info, Moon, TrendingUp } from 'lucide-react';
import type { FrequencyInsights } from '../../types';
import { formatHour } from '../../utils/frequency-utils';

interface FrequencyInsightsProps {
  insights: FrequencyInsights;
  timeFormat?: '12h' | '24h';
  activityLabel?: string; // e.g., "sleep", "feeding", "diaper changes"
  colorVar?: string; // Activity color (e.g., 'var(--activity-sleep)')
}

export function FrequencyInsightsComponent({
  insights,
  timeFormat = '12h',
  colorVar = 'var(--primary)',
}: FrequencyInsightsProps) {
  const getConsistencyLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Variable';
  };

  const getConsistencyColor = (score: number): string => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <div className="space-y-4">
      {/* Peak Hours */}
      {insights.peakHours.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="size-4" style={{ color: colorVar }} />
            <h4 className="text-sm font-medium text-foreground">
              Most Common Times
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {insights.peakHours.map((peak, idx) => (
              <div
                className="rounded-lg border bg-muted/50 p-3 text-center"
                key={peak.hour}
              >
                <div
                  className="text-lg font-semibold"
                  style={{ color: colorVar }}
                >
                  {formatHour(peak.hour, timeFormat)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {peak.count} times
                </div>
                {idx === 0 && (
                  <div
                    className="mt-1 text-[10px] font-medium"
                    style={{ color: colorVar }}
                  >
                    Peak
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consistency Score and Longest Gap side by side */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Consistency Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4" style={{ color: colorVar }} />
              <h4 className="text-sm font-medium text-foreground">
                Consistency
              </h4>
            </div>
            <span
              className={`text-sm font-semibold ${getConsistencyColor(insights.consistencyScore)}`}
            >
              {getConsistencyLabel(insights.consistencyScore)}
            </span>
          </div>
          <div className="space-y-1">
            <Progress
              style={
                {
                  ['--progress-foreground' as string]: colorVar,
                } as React.CSSProperties
              }
              value={insights.consistencyScore}
            />
            <p className="text-xs text-center text-muted-foreground">
              {insights.consistencyScore >= 80 &&
                'Occurs at similar times each day'}
              {insights.consistencyScore >= 60 &&
                insights.consistencyScore < 80 &&
                'Follows a predictable pattern'}
              {insights.consistencyScore >= 40 &&
                insights.consistencyScore < 60 &&
                'Some timing variation throughout the day'}
              {insights.consistencyScore < 40 &&
                'Occurs at different times each day'}
            </p>
          </div>
        </div>

        {/* Longest Gap */}
        {insights.longestGap.hours > 0 &&
          insights.longestGap.from &&
          insights.longestGap.to && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Moon className="size-4" style={{ color: colorVar }} />
                <h4 className="text-sm font-medium text-foreground">
                  Longest Gap
                </h4>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3 text-center">
                <div
                  className="text-lg font-semibold"
                  style={{ color: colorVar }}
                >
                  {insights.longestGap.hours.toFixed(1)}h
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(insights.longestGap.from, 'MMM d, h:mm a')} -{' '}
                  {format(insights.longestGap.to, 'h:mm a')}
                </div>
                {insights.longestGap.hours >= 8 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Likely overnight
                  </p>
                )}
              </div>
            </div>
          )}
      </div>

      {/* Empty state */}
      {insights.peakHours.length === 0 &&
        insights.consistencyScore === 0 &&
        insights.longestGap.hours === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Info className="mb-2 size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Not enough data yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Log more to see patterns
            </p>
          </div>
        )}
    </div>
  );
}
