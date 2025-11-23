'use client';

import { differenceInMinutes, format, getHours, getMinutes } from 'date-fns';
import { useMemo } from 'react';
import type { TimeBlockData } from '../../types';
import { formatHour } from '../../utils/frequency-utils';
import { formatDayAbbreviation } from '../stats/chart-utils';

interface TimeBlockChartProps {
  data: TimeBlockData[];
  colorVar: string; // CSS variable name (e.g., 'var(--activity-sleep)')
  timeFormat?: '12h' | '24h';
  showActivityType?: boolean;
}

export function TimeBlockChart({
  data,
  colorVar,
  timeFormat = '12h',
}: TimeBlockChartProps) {
  // Process activities to show full duration ranges
  const processedData = useMemo(() => {
    return data.map((dayData) => {
      const activityRanges: Array<{
        startPercent: number;
        heightPercent: number;
        count: number;
        tooltip: string;
      }> = [];

      // Collect all activities for this day
      const allActivities = dayData.blocks.flatMap((block) => block.activities);

      allActivities.forEach((activity) => {
        const startTime = new Date(activity.startTime);
        const startHour = getHours(startTime);
        const startMinute = getMinutes(startTime);
        const startPercent = ((startHour * 60 + startMinute) / (24 * 60)) * 100;

        let heightPercent: number;
        let tooltip: string;

        if (activity.endTime) {
          // Calculate duration span
          const endTime = new Date(activity.endTime);
          const durationMinutes = differenceInMinutes(endTime, startTime);
          heightPercent = (durationMinutes / (24 * 60)) * 100;
          tooltip = `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
        } else {
          // Default to 30 minute block if no end time
          heightPercent = (30 / (24 * 60)) * 100;
          tooltip = format(startTime, 'h:mm a');
        }

        activityRanges.push({
          count: 1,
          heightPercent: Math.max(heightPercent, 0.5), // Minimum visible height
          startPercent,
          tooltip,
        });
      });

      return {
        ...dayData,
        activityRanges,
      };
    });
  }, [data]);

  return (
    <div className="w-full space-y-4">
      <div className="flex h-[400px] w-full gap-2">
        {/* Time axis (left side) */}
        <div className="flex flex-col justify-between py-8">
          {[0, 6, 12, 18, 23].map((hour) => (
            <div className="text-xs text-muted-foreground" key={hour}>
              {formatHour(hour, timeFormat)}
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex flex-1 gap-1">
          {processedData.map((dayData) => {
            const date = new Date(dayData.date);
            return (
              <div
                className="flex flex-1 flex-col gap-1 min-w-0"
                key={dayData.date}
              >
                {/* Day label */}
                <div className="text-center text-xs font-medium text-muted-foreground">
                  {formatDayAbbreviation(date)}
                </div>

                {/* Time blocks container */}
                <div className="relative flex-1 rounded-lg border border-muted-foreground/10 bg-muted/20 overflow-hidden">
                  {/* Hour grid lines */}
                  {[0, 6, 12, 18, 24].map((hour) => (
                    <div
                      className="absolute left-0 right-0 border-t border-muted-foreground/10"
                      key={hour}
                      style={{
                        top: `${(hour / 24) * 100}%`,
                      }}
                    />
                  ))}

                  {/* Activity blocks with full duration */}
                  {dayData.activityRanges.map((range, idx) => {
                    return (
                      <div
                        className="absolute left-1 right-1 rounded-full transition-all hover:brightness-110"
                        key={`activity-${idx}-${range.startPercent}`}
                        style={{
                          backgroundColor: colorVar,
                          height: `${range.heightPercent}%`,
                          opacity: 0.7,
                          top: `${range.startPercent}%`,
                        }}
                        title={range.tooltip}
                      />
                    );
                  })}
                </div>

                {/* Date label */}
                <div className="text-center text-[10px] text-muted-foreground">
                  {format(date, 'M/d')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-6 rounded-full opacity-70"
            style={{ backgroundColor: colorVar }}
          />
          <span>Activity duration</span>
        </div>
      </div>
    </div>
  );
}
