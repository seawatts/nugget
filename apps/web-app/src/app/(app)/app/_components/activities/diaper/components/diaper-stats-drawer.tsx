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
  ComparisonChart,
  FrequencyHeatmap,
  FrequencyInsightsComponent,
  getComparisonContent,
  getTrendContent,
  RecentActivitiesList,
  StatsDrawerWrapper,
  TimeBlockChart,
} from '../../shared/components/stats';
import type {
  AmountType,
  ComparisonData,
  ComparisonTimeRange,
  TrendData,
} from '../../shared/types';
import { TIME_RANGE_OPTIONS } from '../../shared/types';
import {
  calculateHourlyFrequency,
  calculateTimeBlockData,
  detectPatterns,
} from '../../shared/utils/frequency-utils';
import { calculateDiaperStatsWithComparison } from '../diaper-goals';
import { DiaperTrendChart } from './diaper-trend-chart';

type DiaperMetricType = 'total' | 'wet' | 'dirty' | 'both';

interface DiaperStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trendData: TrendData[];
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
  trendData,
  activities,
  recentActivities,
  timeFormat,
}: DiaperStatsDrawerProps) {
  const [metricType, setMetricType] = useState<DiaperMetricType>('total');
  const [amountType, setAmountType] = useState<AmountType>('total');
  const [timeRange, setTimeRange] = useState<ComparisonTimeRange>('24h');
  const [timelineFilterType, setTimelineFilterType] =
    useState<DiaperMetricType>('total');
  const [heatmapFilterType, setHeatmapFilterType] =
    useState<DiaperMetricType>('total');

  // Calculate stats based on selected time range
  const statsComparison = useMemo(() => {
    const selectedRange = TIME_RANGE_OPTIONS.find(
      (opt) => opt.value === timeRange,
    );
    return calculateDiaperStatsWithComparison(
      activities,
      selectedRange?.hours ?? 24,
    );
  }, [activities, timeRange]);

  const trendContent = getTrendContent('diaper');
  const selectedRangeHours =
    TIME_RANGE_OPTIONS.find((opt) => opt.value === timeRange)?.hours ?? 24;
  const comparisonContent = getComparisonContent(timeRange, selectedRangeHours);

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

  // Calculate frequency data
  const diaperActivities = useMemo(
    () => activities.filter((a) => a.type === 'diaper'),
    [activities],
  );

  // Filter to last 30 days for heatmap
  const last30DaysDiaperActivities = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    return diaperActivities.filter(
      (activity) => new Date(activity.startTime) >= thirtyDaysAgo,
    );
  }, [diaperActivities]);

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
      last30DaysDiaperActivities,
      heatmapFilterType,
    );
    return calculateHourlyFrequency(filteredActivities);
  }, [last30DaysDiaperActivities, heatmapFilterType, filterByDiaperType]);

  const timeBlockData = useMemo(() => {
    const filteredActivities = filterByDiaperType(
      diaperActivities,
      timelineFilterType,
    );
    return calculateTimeBlockData(filteredActivities, 7);
  }, [diaperActivities, timelineFilterType, filterByDiaperType]);

  const frequencyInsights = useMemo(
    () => detectPatterns(diaperActivities),
    [diaperActivities],
  );

  const comparisonData: ComparisonData[] = [
    {
      current: statsComparison.current.total,
      metric: 'All',
      previous: statsComparison.previous.total,
    },
    {
      current: statsComparison.current.wet,
      metric: 'Wet',
      previous: statsComparison.previous.wet,
    },
    {
      current: statsComparison.current.dirty,
      metric: 'Dirty',
      previous: statsComparison.previous.dirty,
    },
    {
      current: statsComparison.current.both,
      metric: 'Both',
      previous: statsComparison.previous.both,
    },
  ];

  return (
    <StatsDrawerWrapper
      onOpenChange={onOpenChange}
      open={open}
      title="Diaper Statistics"
    >
      {/* Trend Chart Section */}
      <Card className="p-4">
        <div className="mb-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                {trendContent.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {trendContent.description}
              </p>
            </div>
            <div className="flex gap-2">
              {/* Metric Type Dropdown (mobile-friendly) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    {getMetricLabel(metricType)}
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setMetricType('total')}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMetricType('wet')}>
                    Pee
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMetricType('dirty')}>
                    Poop
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMetricType('both')}>
                    Both
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Total/Average Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    {amountType === 'total' ? 'Total' : 'Avg'}
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setAmountType('total')}>
                    Total
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAmountType('average')}>
                    Average
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <DiaperTrendChart
          amountType={amountType}
          data={trendData}
          metricType={metricType}
        />
      </Card>

      {/* Comparison Stats Section */}
      <Card className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              {comparisonContent.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {comparisonContent.description}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                {
                  TIME_RANGE_OPTIONS.find((opt) => opt.value === timeRange)
                    ?.label
                }
                <ChevronDown className="ml-1 size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {TIME_RANGE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ComparisonChart
          colorClass="var(--activity-diaper)"
          currentLabel={comparisonContent.currentLabel}
          data={comparisonData}
          previousLabel={comparisonContent.previousLabel}
        />
      </Card>

      {/* Timeline Card */}
      <Card className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Timeline</h3>
            <p className="text-xs text-muted-foreground">
              When changes occur throughout the day
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                {getMetricLabel(timelineFilterType)}
                <ChevronDown className="ml-1 size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTimelineFilterType('total')}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimelineFilterType('wet')}>
                Pee
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimelineFilterType('dirty')}>
                Poop
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimelineFilterType('both')}>
                Both
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              Frequency patterns by day and time
            </p>
          </div>
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
