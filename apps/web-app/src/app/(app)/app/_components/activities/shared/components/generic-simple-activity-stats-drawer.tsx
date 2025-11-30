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
import { useEffect, useMemo, useState } from 'react';
import type { SimpleActivityConfig } from '../activity-config-registry';
import { calculateSimpleActivityStat } from '../activity-stat-calculations';
import type {
  HeatmapRangeValue,
  StatMetricType,
  StatPivotPeriod,
  StatTimePeriod,
  TimelineWeekRange,
} from '../types';
import {
  getPivotPeriodOptionsForTimePeriod,
  HEATMAP_RANGE_OPTIONS,
  STAT_TIME_PERIOD_OPTIONS,
  TIMELINE_WEEK_OPTIONS,
} from '../types';
import {
  getCustomDateRangeLabel,
  getDateRangeLabel,
} from '../utils/date-range-utils';
import {
  calculateHourlyFrequency,
  calculateTimeBlockData,
  detectPatterns,
} from '../utils/frequency-utils';
import { calculateGenericTrendData } from '../utils/generic-trend-calculator';
import { getDateRangeLabelForPeriod } from '../utils/stat-calculations';
import { GenericTrendChart } from './generic-trend-chart';
import {
  FrequencyHeatmap,
  FrequencyInsightsComponent,
  NumericStatCard,
  RecentActivitiesList,
  StatsDrawerWrapper,
  TimeBlockChart,
} from './stats';

interface GenericSimpleActivityStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: Array<typeof Activities.$inferSelect>;
  config: SimpleActivityConfig;
  timeFormat: '12h' | '24h';
}

export function GenericSimpleActivityStatsDrawer({
  open,
  onOpenChange,
  activities,
  config,
  timeFormat,
}: GenericSimpleActivityStatsDrawerProps) {
  const [trendTimeRange, setTrendTimeRange] = useState<
    '24h' | '7d' | '2w' | '1m' | '3m' | '6m'
  >('7d');
  const [timelineRange, setTimelineRange] =
    useState<TimelineWeekRange>('this_week');
  const [heatmapRange, setHeatmapRange] = useState<HeatmapRangeValue>('30d');
  const [statCardsTimePeriod, setStatCardsTimePeriod] =
    useState<StatTimePeriod>('this_week');
  const [statCardsPivotPeriod, setStatCardsPivotPeriod] =
    useState<StatPivotPeriod>('total');

  // Reset pivot period if it's not available for the selected time period
  useEffect(() => {
    const availableOptions =
      getPivotPeriodOptionsForTimePeriod(statCardsTimePeriod);
    const isCurrentPivotAvailable = availableOptions.some(
      (opt) => opt.value === statCardsPivotPeriod,
    );
    if (!isCurrentPivotAvailable) {
      setStatCardsPivotPeriod('total');
    }
  }, [statCardsTimePeriod, statCardsPivotPeriod]);

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
    () => calculateGenericTrendData(activities, config.type, trendTimeRange),
    [activities, config.type, trendTimeRange],
  );

  // Calculate frequency data
  const filteredActivities = useMemo(
    () => activities.filter((a) => a.type === config.type),
    [activities, config.type],
  );

  // Filter to selected range for heatmap
  const heatmapActivities = useMemo(() => {
    const cutoff = subDays(new Date(), selectedHeatmapOption.days);
    return filteredActivities.filter(
      (activity) => new Date(activity.startTime) >= cutoff,
    );
  }, [selectedHeatmapOption, filteredActivities]);

  const frequencyHeatmapData = useMemo(
    () => calculateHourlyFrequency(heatmapActivities),
    [heatmapActivities],
  );
  const heatmapDateRangeLabel = useMemo(
    () => getCustomDateRangeLabel(selectedHeatmapOption.days),
    [selectedHeatmapOption.days],
  );

  const timeBlockData = useMemo(
    () => calculateTimeBlockData(filteredActivities, 7, timelineOffsetDays),
    [filteredActivities, timelineOffsetDays],
  );

  const frequencyInsights = useMemo(
    () => detectPatterns(filteredActivities),
    [filteredActivities],
  );

  // Prepare recent activities for list component
  const recentActivities = filteredActivities.slice(0, 10).map((activity) => ({
    amountMl: activity.amountMl ?? undefined,
    duration: activity.duration ?? undefined,
    notes: activity.notes ?? undefined,
    time: new Date(activity.startTime),
    type: undefined, // Simple activities don't have subtypes
  }));

  const dateRangeLabel = useMemo(
    () => getDateRangeLabel(trendTimeRange),
    [trendTimeRange],
  );
  const timelineDateRangeLabel = useMemo(
    () => getDateRangeLabel('7d', new Date(), timelineOffsetDays),
    [timelineOffsetDays],
  );

  // Create calculate function for NumericStatCard
  const calculateStatForCard = useMemo(
    () => (metric: StatMetricType, timePeriod: StatTimePeriod) =>
      calculateSimpleActivityStat(
        activities,
        config.type,
        metric,
        timePeriod,
        config.title,
        statCardsPivotPeriod,
      ),
    [activities, config.type, config.title, statCardsPivotPeriod],
  );

  const colorVar = `var(--activity-${config.type.replace(/_/g, '-')})`;

  return (
    <StatsDrawerWrapper
      onOpenChange={onOpenChange}
      open={open}
      title={`${config.title} Statistics`}
    >
      {/* Stat Cards Section with Shared Time Period Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Quick Stats</h3>
            <p className="text-xs text-muted-foreground">
              {getDateRangeLabelForPeriod(statCardsTimePeriod)}
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  {STAT_TIME_PERIOD_OPTIONS.find(
                    (opt) => opt.value === statCardsTimePeriod,
                  )?.label ?? 'This Week'}
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {STAT_TIME_PERIOD_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setStatCardsTimePeriod(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  {getPivotPeriodOptionsForTimePeriod(statCardsTimePeriod).find(
                    (opt) => opt.value === statCardsPivotPeriod,
                  )?.label ?? 'Total'}
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {getPivotPeriodOptionsForTimePeriod(statCardsTimePeriod).map(
                  (option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setStatCardsPivotPeriod(option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumericStatCard
            availableMetrics={['count']}
            calculateStat={calculateStatForCard}
            defaultMetric="count"
            showDateRange={false}
            timePeriod={statCardsTimePeriod}
          />
        </div>
      </div>

      {/* Trend Chart Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Trend</h3>
            <p className="text-xs text-muted-foreground">{dateRangeLabel}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                {trendTimeRange === '24h'
                  ? '24 Hours'
                  : trendTimeRange === '7d'
                    ? '7 Days'
                    : trendTimeRange === '2w'
                      ? '2 Weeks'
                      : trendTimeRange === '1m'
                        ? '1 Month'
                        : trendTimeRange === '3m'
                          ? '3 Months'
                          : '6 Months'}
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

        <Card className="p-4">
          <GenericTrendChart
            colorVar={colorVar}
            data={dynamicTrendData}
            timeRange={trendTimeRange}
          />
        </Card>
      </div>

      {/* Frequency Heatmap Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Time of Day</h3>
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
          colorVar={colorVar}
          data={frequencyHeatmapData}
          timeFormat={timeFormat}
        />
      </div>

      {/* Frequency Insights */}
      {frequencyInsights.length > 0 && (
        <FrequencyInsightsComponent
          colorVar={colorVar}
          insights={frequencyInsights}
        />
      )}

      {/* Time Block Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Weekly View</h3>
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
          activityLabel={config.title.toLowerCase()}
          colorVar={colorVar}
          data={timeBlockData}
        />
      </div>

      {/* Recent Activities */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Recent Activity</h3>
        <RecentActivitiesList
          activities={recentActivities}
          activityType={config.type}
          colorVar={colorVar}
          title={config.title}
        />
      </div>
    </StatsDrawerWrapper>
  );
}
