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
import { useCallback, useMemo, useState } from 'react';
import {
  FrequencyHeatmap,
  FrequencyInsightsComponent,
  getTrendContent,
  RecentActivitiesList,
  StatsDrawerWrapper,
  TimeBlockChart,
} from '../../shared/components/stats';
import type {
  HeatmapRangeValue,
  TimelineWeekRange,
  TrendTimeRange,
} from '../../shared/types';
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
import { calculateDiaperTrendData } from '../diaper-goals';
import { DiaperTrendChart } from './diaper-trend-chart';

type DiaperMetricType = 'total' | 'wet' | 'dirty' | 'both';

const TREND_RANGE_OPTIONS: Array<{ value: TrendTimeRange; label: string }> = [
  { label: '24 Hours', value: '24h' },
  { label: '7 Days', value: '7d' },
  { label: '2 Weeks', value: '2w' },
  { label: '1 Month', value: '1m' },
  { label: '3 Months', value: '3m' },
  { label: '6 Months', value: '6m' },
];

const getTrendRangeLabel = (value: TrendTimeRange) =>
  TREND_RANGE_OPTIONS.find((option) => option.value === value)?.label ||
  TREND_RANGE_OPTIONS[1]?.label ||
  '7 Days';

interface DiaperStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: Array<typeof Activities.$inferSelect>; // Raw activities for dynamic stats calculation
  recentActivities: Array<{
    time: Date;
    type?: 'wet' | 'dirty' | 'both';
    [key: string]: unknown;
  }>;
  timeFormat: '12h' | '24h';
}

export function DiaperStatsDrawer({
  open,
  onOpenChange,
  activities,
  recentActivities,
  timeFormat,
}: DiaperStatsDrawerProps) {
  const [trendTimeRange, setTrendTimeRange] = useState<TrendTimeRange>('7d');
  const [timelineFilterType, setTimelineFilterType] =
    useState<DiaperMetricType>('total');
  const [heatmapFilterType, setHeatmapFilterType] =
    useState<DiaperMetricType>('total');
  const [timelineRange, setTimelineRange] =
    useState<TimelineWeekRange>('this_week');
  const [heatmapRange, setHeatmapRange] = useState<HeatmapRangeValue>('30d');

  const trendContent = getTrendContent('diaper');
  const trendDateRangeLabel = useMemo(
    () => getDateRangeLabel(trendTimeRange),
    [trendTimeRange],
  );
  const dynamicTrendData = useMemo(
    () => calculateDiaperTrendData(activities, trendTimeRange),
    [activities, trendTimeRange],
  );

  // Helper functions
  const getMetricLabel = (type: DiaperMetricType) => {
    switch (type) {
      case 'total':
        return 'All';
      case 'wet':
        return 'Pee';
      case 'dirty':
        return 'Poop';
      case 'both':
        return 'Both';
    }
  };

  const fallbackTimelineOption = TIMELINE_WEEK_OPTIONS[0] ?? {
    label: 'This Week',
    offsetDays: 0,
    value: 'this_week',
  };
  const selectedTimelineOption =
    TIMELINE_WEEK_OPTIONS.find((option) => option.value === timelineRange) ??
    fallbackTimelineOption;
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
  const timelineOffsetDays = selectedTimelineOption.offsetDays;

  // Calculate frequency data
  const diaperActivities = useMemo(
    () => activities.filter((a) => a.type === 'diaper'),
    [activities],
  );

  // Filter for heatmap range
  const heatmapDiaperActivities = useMemo(() => {
    const cutoff = subDays(new Date(), selectedHeatmapOption.days);
    return diaperActivities.filter(
      (activity) => new Date(activity.startTime) >= cutoff,
    );
  }, [diaperActivities, selectedHeatmapOption]);

  // Filter activities by diaper type
  const filterByDiaperType = useCallback(
    (
      activities: Array<typeof Activities.$inferSelect>,
      filterType: DiaperMetricType,
    ) => {
      if (filterType === 'total') return activities;

      return activities.filter((activity) => {
        const details = activity.details as { type?: string } | null;
        const type = details?.type;

        if (filterType === 'both') {
          return type === 'both';
        }

        // For 'wet' or 'dirty', include exact matches OR 'both'
        return type === filterType || type === 'both';
      });
    },
    [],
  );

  const frequencyHeatmapData = useMemo(() => {
    const filteredActivities = filterByDiaperType(
      heatmapDiaperActivities,
      heatmapFilterType,
    );
    return calculateHourlyFrequency(filteredActivities);
  }, [heatmapDiaperActivities, heatmapFilterType, filterByDiaperType]);
  const heatmapDateRangeLabel = useMemo(
    () => getCustomDateRangeLabel(selectedHeatmapOption.days),
    [selectedHeatmapOption.days],
  );

  const timeBlockData = useMemo(() => {
    const filteredActivities = filterByDiaperType(
      diaperActivities,
      timelineFilterType,
    );
    return calculateTimeBlockData(filteredActivities, 7, timelineOffsetDays);
  }, [
    diaperActivities,
    timelineFilterType,
    filterByDiaperType,
    timelineOffsetDays,
  ]);
  const timelineDateRangeLabel = useMemo(
    () => getDateRangeLabel('7d', new Date(), timelineOffsetDays),
    [timelineOffsetDays],
  );

  const frequencyInsights = useMemo(
    () => detectPatterns(diaperActivities),
    [diaperActivities],
  );

  return (
    <StatsDrawerWrapper
      onOpenChange={onOpenChange}
      open={open}
      title="Diaper Statistics"
    >
      {/* Trend Chart Section */}
      <Card className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              {trendContent.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {trendDateRangeLabel}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                {getTrendRangeLabel(trendTimeRange)}
                <ChevronDown className="ml-1 size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {TREND_RANGE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setTrendTimeRange(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <DiaperTrendChart data={dynamicTrendData} />
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
          <div className="flex gap-2">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  {getMetricLabel(timelineFilterType)}
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setTimelineFilterType('total')}
                >
                  All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimelineFilterType('wet')}>
                  Pee
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTimelineFilterType('dirty')}
                >
                  Poop
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimelineFilterType('both')}>
                  Both
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <TimeBlockChart
          colorVar="var(--activity-diaper)"
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
          <div className="flex gap-2">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  {getMetricLabel(heatmapFilterType)}
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setHeatmapFilterType('total')}>
                  All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setHeatmapFilterType('wet')}>
                  Pee
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setHeatmapFilterType('dirty')}>
                  Poop
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setHeatmapFilterType('both')}>
                  Both
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <FrequencyHeatmap
          colorVar="var(--activity-diaper)"
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
          activityLabel="diaper changes"
          colorVar="var(--activity-diaper)"
          insights={frequencyInsights}
          timeFormat={timeFormat}
        />
      </Card>

      {/* Recent Activities Section */}
      {recentActivities.length > 0 && (
        <Card className="p-4">
          <RecentActivitiesList
            activities={recentActivities}
            activityType="diaper"
            timeFormat={timeFormat}
            title="Diaper"
          />
        </Card>
      )}
    </StatsDrawerWrapper>
  );
}
