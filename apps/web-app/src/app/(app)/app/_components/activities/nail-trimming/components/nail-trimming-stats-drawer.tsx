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
import type { HeatmapRangeValue, TimelineWeekRange } from '../../shared/types';
import {
  HEATMAP_RANGE_OPTIONS,
  TIMELINE_WEEK_OPTIONS,
} from '../../shared/types';
import {
  getCustomDateRangeLabel,
  getDateRangeLabel,
} from '../../shared/utils/date-range-utils';
import {
  calculateHourlyFrequency,
  calculateTimeBlockData,
  detectPatterns,
} from '../../shared/utils/frequency-utils';
import { calculateNailTrimmingTrendData } from '../nail-trimming-stats';
import { NailTrimmingTrendChart } from './nail-trimming-trend-chart';

interface NailTrimmingStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: Array<typeof Activities.$inferSelect>;
  timeFormat: '12h' | '24h';
}

export function NailTrimmingStatsDrawer({
  open,
  onOpenChange,
  activities,
  timeFormat,
}: NailTrimmingStatsDrawerProps) {
  const [trendTimeRange, setTrendTimeRange] = useState<
    '24h' | '7d' | '2w' | '1m' | '3m' | '6m'
  >('7d');
  const [timelineRange, setTimelineRange] =
    useState<TimelineWeekRange>('this_week');
  const [heatmapRange, setHeatmapRange] = useState<HeatmapRangeValue>('30d');

  const selectedTimelineOption = TIMELINE_WEEK_OPTIONS.find(
    (option) => option.value === timelineRange,
  ) ??
    TIMELINE_WEEK_OPTIONS[0] ?? {
      label: 'This Week',
      offsetDays: 0,
      value: 'this_week',
    };
  const timelineOffsetDays = selectedTimelineOption.offsetDays;
  const fallbackHeatmapOption = HEATMAP_RANGE_OPTIONS.find(
    (option) => option.value === '30d',
  ) ??
    HEATMAP_RANGE_OPTIONS[0] ?? {
      days: 30,
      label: '30 Days',
      value: '30d',
    };
  const selectedHeatmapOption =
    HEATMAP_RANGE_OPTIONS.find((option) => option.value === heatmapRange) ??
    fallbackHeatmapOption;

  // Calculate trend data based on selected time range
  const dynamicTrendData = useMemo(
    () => calculateNailTrimmingTrendData(activities, trendTimeRange),
    [activities, trendTimeRange],
  );

  // Calculate frequency data
  const nailTrimmingActivities = useMemo(
    () => activities.filter((a) => a.type === 'nail_trimming'),
    [activities],
  );

  // Filter to selected range for heatmap
  const heatmapNailTrimmingActivities = useMemo(() => {
    const cutoff = subDays(new Date(), selectedHeatmapOption.days);
    return nailTrimmingActivities.filter(
      (activity) => new Date(activity.startTime) >= cutoff,
    );
  }, [selectedHeatmapOption, nailTrimmingActivities]);

  const frequencyHeatmapData = useMemo(
    () => calculateHourlyFrequency(heatmapNailTrimmingActivities),
    [heatmapNailTrimmingActivities],
  );
  const heatmapDateRangeLabel = useMemo(
    () => getCustomDateRangeLabel(selectedHeatmapOption.days),
    [selectedHeatmapOption.days],
  );

  const timeBlockData = useMemo(
    () => calculateTimeBlockData(nailTrimmingActivities, 7, timelineOffsetDays),
    [nailTrimmingActivities, timelineOffsetDays],
  );

  const frequencyInsights = useMemo(
    () => detectPatterns(nailTrimmingActivities),
    [nailTrimmingActivities],
  );

  // Prepare recent activities for list component
  const recentActivities = nailTrimmingActivities
    .slice(0, 10)
    .map((activity) => ({
      amountMl: activity.amountMl ?? undefined,
      duration: activity.duration ?? undefined,
      notes: activity.notes ?? undefined,
      time: new Date(activity.startTime),
      type: undefined,
    }));

  const dateRangeLabel = useMemo(
    () => getDateRangeLabel(trendTimeRange),
    [trendTimeRange],
  );
  const timelineDateRangeLabel = useMemo(
    () => getDateRangeLabel('7d', new Date(), timelineOffsetDays),
    [timelineOffsetDays],
  );

  return (
    <StatsDrawerWrapper
      onOpenChange={onOpenChange}
      open={open}
      title="Nail Trimming Statistics"
    >
      {/* Trend Chart Section */}
      <Card className="p-4">
        <div className="mb-3 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Nail Trimmings
              </h3>
              <p className="text-xs text-muted-foreground">{dateRangeLabel}</p>
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
        <NailTrimmingTrendChart
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
              {timelineDateRangeLabel}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                {selectedTimelineOption.label}
                <ChevronDown className="ml-1 size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {TIMELINE_WEEK_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setTimelineRange(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <TimeBlockChart
          colorVar="var(--activity-nail-trimming)"
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
              {heatmapDateRangeLabel}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                {selectedHeatmapOption.label}
                <ChevronDown className="ml-1 size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {HEATMAP_RANGE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setHeatmapRange(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <FrequencyHeatmap
          colorVar="var(--activity-nail-trimming)"
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
          activityLabel="nail trimmings"
          colorVar="var(--activity-nail-trimming)"
          insights={frequencyInsights}
          timeFormat={timeFormat}
        />
      </Card>

      {/* Recent Activities Section */}
      {recentActivities.length > 0 && (
        <Card className="p-4">
          <RecentActivitiesList
            activities={recentActivities}
            activityType="nail_trimming"
            timeFormat={timeFormat}
            title="Nail Trimming"
          />
        </Card>
      )}
    </StatsDrawerWrapper>
  );
}
