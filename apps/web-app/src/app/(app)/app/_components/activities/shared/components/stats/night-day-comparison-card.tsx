'use client';

import { Card } from '@nugget/ui/card';
import type { StatTimePeriod } from '../../types';
import { getDateRangeLabelForPeriod } from '../../utils/stat-calculations';

interface StatItem {
  label: string;
  value: string | number;
}

interface NightDayComparisonCardProps {
  /**
   * Title for the card
   */
  title: string;
  /**
   * Night statistics to display
   */
  nightStats: StatItem[];
  /**
   * Day statistics to display
   */
  dayStats: StatItem[];
  /**
   * Time period for the stats
   */
  timePeriod: StatTimePeriod;
  /**
   * Optional insight text to display below the stats
   */
  insight?: string;
}

export function NightDayComparisonCard({
  dayStats,
  insight,
  nightStats,
  timePeriod,
  title,
}: NightDayComparisonCardProps) {
  const dateRangeLabel = getDateRangeLabelForPeriod(timePeriod);

  return (
    <Card className="p-4">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{dateRangeLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Night Column */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground">
            Night (6 PM - 6 AM)
          </div>
          <div className="space-y-2">
            {nightStats.map((stat) => (
              <div key={stat.label}>
                <div className="text-xs text-muted-foreground">
                  {stat.label}
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Day Column */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground">
            Day (6 AM - 6 PM)
          </div>
          <div className="space-y-2">
            {dayStats.map((stat) => (
              <div key={stat.label}>
                <div className="text-xs text-muted-foreground">
                  {stat.label}
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {insight && (
        <div className="mt-4 rounded-md bg-muted/50 p-2">
          <p className="text-xs text-muted-foreground">{insight}</p>
        </div>
      )}
    </Card>
  );
}
