'use client';

import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nugget/ui/dropdown-menu';
import { subDays } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  FrequencyHeatmap,
  FrequencyInsightsComponent,
  RecentActivitiesList,
  StatsDrawerWrapper,
  TimeBlockChart,
} from '../../shared/components/stats';
import {
  calculateHourlyFrequency,
  calculateTimeBlockData,
  detectPatterns,
} from '../../shared/utils/frequency-utils';
import { calculateVitaminDTrendData } from '../vitamin-d-stats';
import { VitaminDTrendChart } from './vitamin-d-trend-chart';

interface VitaminDStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: Array<typeof Activities.$inferSelect>;
  timeFormat: '12h' | '24h';
}

export function VitaminDStatsDrawer({
  open,
  onOpenChange,
  activities,
  timeFormat,
}: VitaminDStatsDrawerProps) {
  const [trendTimeRange, setTrendTimeRange] = useState<
    '24h' | '7d' | '2w' | '1m' | '3m' | '6m'
  >('7d');

  // Calculate trend data based on selected time range
  const dynamicTrendData = useMemo(
    () => calculateVitaminDTrendData(activities, trendTimeRange),
    [activities, trendTimeRange],
  );

  // Calculate frequency data
  const vitaminDActivities = useMemo(
    () => activities.filter((a) => a.type === 'vitamin_d'),
    [activities],
  );

  // Filter to last 30 days for heatmap
  const last30DaysVitaminDActivities = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    return vitaminDActivities.filter(
      (activity) => new Date(activity.startTime) >= thirtyDaysAgo,
    );
  }, [vitaminDActivities]);

  const frequencyHeatmapData = useMemo(
    () => calculateHourlyFrequency(last30DaysVitaminDActivities),
    [last30DaysVitaminDActivities],
  );

  const timeBlockData = useMemo(
    () => calculateTimeBlockData(vitaminDActivities, 7),
    [vitaminDActivities],
  );

  const frequencyInsights = useMemo(
    () => detectPatterns(vitaminDActivities),
    [vitaminDActivities],
  );

  // Prepare recent activities for list component
  const recentActivities = vitaminDActivities.slice(0, 10).map((activity) => ({
    amountMl: activity.amountMl ?? undefined,
    duration: activity.duration ?? undefined,
    notes: activity.notes ?? undefined,
    time: new Date(activity.startTime),
    type: undefined, // vitamin_d doesn't have subtypes like wet/dirty
  }));

  return (
    <StatsDrawerWrapper
      onOpenChange={onOpenChange}
      open={open}
      title="Vitamin D Statistics"
    >
      {/* Trend Chart Section */}
      <Card className="p-4">
        <div className="mb-3 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Vitamin D Doses
              </h3>
              <p className="text-xs text-muted-foreground">
                Number of doses logged over time
              </p>
            </div>
            <div className="flex gap-2">
              {/* Time Range Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    {trendTimeRange === '24h' && '24 Hours'}
                    {trendTimeRange === '7d' && '7 Days'}
                    {trendTimeRange === '2w' && '2 Weeks'}
                    {trendTimeRange === '1m' && '1 Month'}
                    {trendTimeRange === '3m' && '3 Months'}
                    {trendTimeRange === '6m' && '6 Months'}
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTrendTimeRange('24h')}>
                    24 Hours
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimeRange('7d')}>
                    7 Days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimeRange('2w')}>
                    2 Weeks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimeRange('1m')}>
                    1 Month
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimeRange('3m')}>
                    3 Months
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimeRange('6m')}>
                    6 Months
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <VitaminDTrendChart
          data={dynamicTrendData}
          timeRange={trendTimeRange}
        />
      </Card>

      {/* Timeline Card */}
      <Card className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Timeline</h3>
            <p className="text-xs text-muted-foreground">
              When vitamin D is taken throughout the day
            </p>
          </div>
        </div>
        <TimeBlockChart
          colorVar="var(--activity-vitamin-d)"
          data={timeBlockData}
          timeFormat={timeFormat}
        />
      </Card>

      {/* Heatmap Card */}
      <Card className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Heatmap</h3>
            <p className="text-xs text-muted-foreground">
              Frequency patterns by day and time
            </p>
          </div>
        </div>
        <FrequencyHeatmap
          colorVar="var(--activity-vitamin-d)"
          data={frequencyHeatmapData}
          timeFormat={timeFormat}
        />
      </Card>

      {/* Frequency Insights Section */}
      <Card className="p-4">
        <div className="mb-3">
          <h3 className="text-sm font-medium text-foreground">
            Pattern Insights
          </h3>
          <p className="text-xs text-muted-foreground">
            Key trends and patterns
          </p>
        </div>
        <FrequencyInsightsComponent
          activityLabel="vitamin D doses"
          colorVar="var(--activity-vitamin-d)"
          insights={frequencyInsights}
          timeFormat={timeFormat}
        />
      </Card>

      {/* Recent Activities Section */}
      {recentActivities.length > 0 && (
        <Card className="p-4">
          <RecentActivitiesList
            activities={recentActivities}
            activityType="vitamin_d"
            timeFormat={timeFormat}
            title="Vitamin D"
          />
        </Card>
      )}
    </StatsDrawerWrapper>
  );
}
