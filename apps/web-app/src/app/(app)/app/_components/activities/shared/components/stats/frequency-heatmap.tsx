'use client';

import { useMemo } from 'react';
import type { FrequencyHeatmapData } from '../../types';
import { formatDayOfWeek, formatHour } from '../../utils/frequency-utils';

interface FrequencyHeatmapProps {
  data: FrequencyHeatmapData[];
  colorVar: string; // CSS variable name (e.g., 'var(--activity-sleep)')
  timeFormat?: '12h' | '24h';
}

export function FrequencyHeatmap({
  data,
  colorVar,
  timeFormat = '12h',
}: FrequencyHeatmapProps) {
  const maxCount = useMemo(
    () => Math.max(...data.map((d) => d.count), 1),
    [data],
  );

  // Show only key hours for better readability
  const displayHours = [0, 3, 6, 9, 12, 15, 18, 21];

  return (
    <div className="w-full space-y-4">
      <div className="flex h-[300px] gap-2">
        {/* Time axis (left side) */}
        <div className="flex flex-col justify-between py-6">
          {displayHours.map((hour) => (
            <div className="text-xs text-muted-foreground" key={hour}>
              {formatHour(hour, timeFormat)}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex flex-1 gap-1 overflow-hidden">
          {Array.from({ length: 7 }, (_, dayIndex) => {
            const dayName = formatDayOfWeek(dayIndex);
            return (
              <div className="flex flex-1 flex-col gap-1 min-w-0" key={dayName}>
                {/* Day label */}
                <div className="text-center text-xs font-medium text-muted-foreground">
                  {dayName}
                </div>

                {/* Hour cells for this day */}
                <div className="flex flex-1 flex-col gap-1">
                  {displayHours.map((hour) => {
                    const cellData = data.find(
                      (d) => d.dayOfWeek === dayIndex && d.hour === hour,
                    );
                    const count = cellData?.count || 0;
                    const opacity =
                      count > 0 ? 0.3 + (count / maxCount) * 0.7 : 0;

                    return (
                      <div
                        className="group relative flex-1 rounded-sm border border-muted-foreground/10 transition-all hover:brightness-110"
                        key={hour}
                        style={{
                          backgroundColor:
                            count > 0 ? colorVar : 'hsl(var(--muted))',
                          opacity: count > 0 ? opacity : 0.3,
                        }}
                        title={`${formatDayOfWeek(dayIndex)} ${formatHour(hour, timeFormat)}: ${count} activities`}
                      >
                        {count > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                            {count}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span>Less frequent</span>
        <div className="flex gap-1">
          {[0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
            <div
              className="size-4 rounded-sm border border-muted-foreground/10"
              key={intensity}
              style={{
                backgroundColor: colorVar,
                opacity: 0.3 + intensity * 0.7,
              }}
            />
          ))}
        </div>
        <span>More frequent</span>
      </div>
    </div>
  );
}
