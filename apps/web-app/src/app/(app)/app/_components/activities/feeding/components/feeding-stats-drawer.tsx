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
import { endOfDay, subDays } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  FrequencyHeatmap,
  FrequencyInsightsComponent,
  NightDayComparisonCard,
  NightDayTrendChart,
  RecentActivitiesList,
  StatsDrawerWrapper,
  TimeBlockChart,
} from '../../shared/components/stats';
import type {
  AmountType,
  HeatmapRangeValue,
  StatMetricType,
  StatPivotPeriod,
  StatTimePeriod,
  TimelineWeekRange,
} from '../../shared/types';
import {
  getPivotPeriodOptionsForTimePeriod,
  HEATMAP_RANGE_OPTIONS,
  STAT_TIME_PERIOD_OPTIONS,
  TIMELINE_WEEK_OPTIONS,
} from '../../shared/types';
import { filterActivitiesUpToDate } from '../../shared/utils/date-based-prediction';
import {
  getCustomDateRangeLabel,
  getDateRangeLabel,
} from '../../shared/utils/date-range-utils';
import {
  calculateHourlyFrequency,
  calculateTimeBlockData,
  detectPatterns,
} from '../../shared/utils/frequency-utils';
import {
  getAgeDaysForDate,
  normalizeGoalContext,
} from '../../shared/utils/goal-utils';
import { getDateRangeLabelForPeriod } from '../../shared/utils/stat-calculations';
import {
  calculateFeedingTrendData,
  getDailyAmountGoal,
  getDailyFeedingGoal,
} from '../feeding-goals';
import {
  calculateAverageClusterFeedingTime,
  calculateAverageFeedingGap,
  calculateBottleCount,
  calculateFeedingStat,
  calculateLargestFeedingAmount,
  calculateLongestFeedingGap,
  calculateNightVsDayFeedingComparison,
  calculateNursingCount,
  calculateShortestFeedingGap,
} from '../feeding-stat-calculations';
import { FeedingTrendChart } from './feeding-trend-chart';

interface FeedingGoalContext {
  babyBirthDate?: Date | string | null;
  babyAgeDays?: number | null;
  predictedIntervalHours?: number | null;
  dataPointsCount?: number;
}

interface FeedingStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: Array<typeof Activities.$inferSelect>; // Raw activities for dynamic stats calculation
  unit: 'ML' | 'OZ';
  recentActivities: Array<{
    time: Date;
    amountMl?: number;
    [key: string]: unknown;
  }>;
  timeFormat: '12h' | '24h';
  dailyCountGoal?: number | null;
  dailyAmountGoal?: number | null;
  goalContext?: FeedingGoalContext | null;
}

const FEEDING_ACTIVITY_TYPES = new Set(['feeding', 'bottle', 'nursing']);

function isFeedingActivity(activity: typeof Activities.$inferSelect) {
  return FEEDING_ACTIVITY_TYPES.has(activity.type);
}

export function FeedingStatsDrawer({
  open,
  onOpenChange,
  activities,
  unit,
  recentActivities,
  timeFormat,
  dailyCountGoal,
  dailyAmountGoal,
  goalContext,
}: FeedingStatsDrawerProps) {
  const [trendTimeRange, setTrendTimeRange] = useState<
    '24h' | '7d' | '2w' | '1m' | '3m' | '6m'
  >('7d');
  const [countAmountType, setCountAmountType] = useState<AmountType>('total');
  const [amountAmountType, setAmountAmountType] = useState<AmountType>('total');
  const [heatmapMetric, setHeatmapMetric] = useState<'count' | 'amount'>(
    'count',
  );
  const [heatmapRange, setHeatmapRange] = useState<HeatmapRangeValue>('30d');
  const [timelineRange, setTimelineRange] =
    useState<TimelineWeekRange>('this_week');
  const [statCardsTimePeriod, setStatCardsTimePeriod] =
    useState<StatTimePeriod>('this_week');
  const [statCardsPivotPeriod, setStatCardsPivotPeriod] =
    useState<StatPivotPeriod>('total');
  const [trendTimePeriod, setTrendTimePeriod] = useState<
    'all' | 'night' | 'day'
  >('all');

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

  // Calculate trend data based on selected time range and time period
  const dynamicTrendData = useMemo(
    () =>
      calculateFeedingTrendData(activities, trendTimeRange, trendTimePeriod),
    [activities, trendTimeRange, trendTimePeriod],
  );

  const normalizedGoalContext = useMemo(
    () => normalizeGoalContext(goalContext),
    [goalContext],
  );

  const trendGoalSeries = useMemo(() => {
    if (
      !normalizedGoalContext ||
      (!normalizedGoalContext.babyBirthDate &&
        typeof normalizedGoalContext.babyAgeDays !== 'number')
    ) {
      return null;
    }

    return dynamicTrendData.map(({ date }) => {
      const targetDate = new Date(date);
      const ageDays = getAgeDaysForDate(targetDate, normalizedGoalContext);
      if (ageDays === null) {
        return { amount: null, count: null };
      }

      // Use end of day for filtering to include all activities from that day
      // The targetDate from trend data is the start of the day, so we need end of day
      // to include all activities that occurred on that date
      const endOfTargetDate = endOfDay(targetDate);

      // Filter activities up to end of target date for accurate goal calculation
      const activitiesUpToDate = filterActivitiesUpToDate(
        activities,
        endOfTargetDate,
      );

      return {
        amount: getDailyAmountGoal(
          ageDays,
          unit,
          undefined, // Let the function calculate from activities
          undefined, // Let the function calculate from activities
          targetDate,
          activitiesUpToDate,
          normalizedGoalContext.babyBirthDate ?? null,
        ),
        count: getDailyFeedingGoal(
          ageDays,
          undefined, // Let the function calculate from activities
          undefined, // Let the function calculate from activities
          targetDate,
          activitiesUpToDate,
          normalizedGoalContext.babyBirthDate ?? null,
        ),
      };
    });
  }, [dynamicTrendData, normalizedGoalContext, unit, activities]);

  const countGoalSeries = trendGoalSeries?.map((entry) => entry.count ?? null);
  const amountGoalSeries = trendGoalSeries?.map(
    (entry) => entry.amount ?? null,
  );

  // Calculate frequency data
  const feedingActivities = useMemo(
    () => activities.filter((activity) => isFeedingActivity(activity)),
    [activities],
  );

  // Filter for heatmap range
  const heatmapFeedingActivities = useMemo(() => {
    const cutoff = subDays(new Date(), selectedHeatmapOption.days);
    return feedingActivities.filter(
      (activity) => new Date(activity.startTime) >= cutoff,
    );
  }, [feedingActivities, selectedHeatmapOption]);

  const frequencyHeatmapData = useMemo(
    () => calculateHourlyFrequency(heatmapFeedingActivities, heatmapMetric),
    [heatmapFeedingActivities, heatmapMetric],
  );

  // Build recent activities with side information from activities array
  const recentActivitiesWithSide = useMemo(() => {
    // Get the most recent feeding activities
    const recent = feedingActivities
      .slice()
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      )
      .slice(0, 5)
      .map((activity) => {
        const base = {
          amountMl: activity.amountMl ?? undefined,
          duration: activity.duration ?? undefined,
          notes: activity.notes ?? undefined,
          time: new Date(activity.startTime),
        };

        // Add side information if it's a nursing activity
        if (activity.type === 'nursing' && activity.details) {
          const details = activity.details as {
            side?: 'left' | 'right' | 'both';
          };
          if (details.side) {
            return {
              ...base,
              details: { side: details.side },
            };
          }
        }

        return base;
      });

    // If we have activities with side info, use those; otherwise fall back to prop
    return recent.length > 0 ? recent : recentActivities;
  }, [feedingActivities, recentActivities]);
  const heatmapDateRangeLabel = useMemo(
    () => getCustomDateRangeLabel(selectedHeatmapOption.days),
    [selectedHeatmapOption.days],
  );

  const timeBlockData = useMemo(
    () => calculateTimeBlockData(feedingActivities, 7, timelineOffsetDays),
    [feedingActivities, timelineOffsetDays],
  );

  const frequencyInsights = useMemo(
    () => detectPatterns(feedingActivities),
    [feedingActivities],
  );

  const dateRangeLabel = useMemo(
    () => getDateRangeLabel(trendTimeRange),
    [trendTimeRange],
  );
  const timelineDateRangeLabel = useMemo(
    () => getDateRangeLabel('7d', new Date(), timelineOffsetDays),
    [timelineOffsetDays],
  );

  // Create calculate function for NumericStatCard
  const calculateFeedingStatForCard = useMemo(
    () => (metric: StatMetricType, timePeriod: StatTimePeriod) =>
      calculateFeedingStat(
        activities,
        metric,
        timePeriod,
        unit,
        statCardsPivotPeriod,
      ),
    [activities, unit, statCardsPivotPeriod],
  );

  // Calculate average cluster feeding time
  const avgClusterTime = useMemo(
    () =>
      calculateAverageClusterFeedingTime(
        activities,
        statCardsTimePeriod,
        timeFormat,
      ),
    [activities, statCardsTimePeriod, timeFormat],
  );

  // Calculate largest feeding amount
  const largestAmount = useMemo(
    () => calculateLargestFeedingAmount(activities, statCardsTimePeriod, unit),
    [activities, statCardsTimePeriod, unit],
  );

  // Calculate longest feeding gap
  const longestGap = useMemo(
    () => calculateLongestFeedingGap(activities, statCardsTimePeriod),
    [activities, statCardsTimePeriod],
  );

  // Calculate shortest feeding gap
  const shortestGap = useMemo(
    () => calculateShortestFeedingGap(activities, statCardsTimePeriod),
    [activities, statCardsTimePeriod],
  );

  // Calculate average feeding gap
  const avgGap = useMemo(
    () => calculateAverageFeedingGap(activities, statCardsTimePeriod),
    [activities, statCardsTimePeriod],
  );

  // Calculate night vs day feeding comparison
  const nightVsDayFeedingComparison = useMemo(
    () =>
      calculateNightVsDayFeedingComparison(
        activities,
        statCardsTimePeriod,
        unit,
      ),
    [activities, statCardsTimePeriod, unit],
  );

  // Calculate night vs day trend data for comparison chart
  const nightVsDayTrendData = useMemo(() => {
    const nightTrendData = calculateFeedingTrendData(
      activities,
      trendTimeRange,
      'night',
    );
    const dayTrendData = calculateFeedingTrendData(
      activities,
      trendTimeRange,
      'day',
    );
    return { dayTrendData, nightTrendData };
  }, [activities, trendTimeRange]);

  return (
    <StatsDrawerWrapper
      onOpenChange={onOpenChange}
      open={open}
      title="Feeding Statistics"
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

        {/* 2x4 Grid of Stat Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Feedings Count Card with Bottle and Nursing breakdown */}
          <Card className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-foreground">
                {
                  calculateFeedingStatForCard('count', statCardsTimePeriod)
                    .label
                }
              </h3>
            </div>
            <div className="mt-4 space-y-2">
              <div>
                <div className="text-3xl font-bold text-foreground">
                  {
                    calculateFeedingStatForCard('count', statCardsTimePeriod)
                      .formattedValue
                  }
                </div>
                <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
                  <span>
                    {
                      calculateBottleCount(
                        activities,
                        statCardsTimePeriod,
                        statCardsPivotPeriod,
                      ).formattedValue
                    }{' '}
                    bottle
                  </span>
                  <span>
                    {
                      calculateNursingCount(
                        activities,
                        statCardsTimePeriod,
                        statCardsPivotPeriod,
                      ).formattedValue
                    }{' '}
                    nursing
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Total Volume Card with Average Amount and Largest Amount underneath */}
          <Card className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-foreground">
                {
                  calculateFeedingStatForCard('total', statCardsTimePeriod)
                    .label
                }
              </h3>
            </div>
            <div className="mt-4 space-y-2">
              <div>
                <div className="text-3xl font-bold text-foreground">
                  {
                    calculateFeedingStatForCard('total', statCardsTimePeriod)
                      .formattedValue
                  }
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>
                    Avg:{' '}
                    {
                      calculateFeedingStatForCard(
                        'average',
                        statCardsTimePeriod,
                      ).formattedValue
                    }
                  </span>
                  <span>Max: {largestAmount.formattedValue}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Average Cluster Feeding Time Card */}
          <Card className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-foreground">
                {avgClusterTime.label}
              </h3>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-foreground">
                {avgClusterTime.formattedValue}
              </div>
            </div>
          </Card>

          {/* Longest Gap Card with Avg Gap and Min Gap underneath */}
          <Card className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-foreground">
                {longestGap.label}
              </h3>
            </div>
            <div className="mt-4 space-y-2">
              <div>
                <div className="text-3xl font-bold text-foreground">
                  {longestGap.formattedValue}
                </div>
                <div className="mt-1 flex flex-col gap-1">
                  <div className="text-sm text-muted-foreground">
                    Avg: {avgGap.formattedValue}
                  </div>
                  {shortestGap.value !== null && (
                    <div className="text-sm text-muted-foreground">
                      Min: {shortestGap.formattedValue}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Night vs Day Feeding Section */}
      <div className="space-y-3">
        <NightDayComparisonCard
          dayStats={[
            {
              label: 'Count',
              value: nightVsDayFeedingComparison.day.formatted.count,
            },
            {
              label: 'Total Amount',
              value: nightVsDayFeedingComparison.day.formatted.total,
            },
            {
              label: 'Avg Amount',
              value: nightVsDayFeedingComparison.day.formatted.avgAmount,
            },
            {
              label: 'Avg Gap',
              value: nightVsDayFeedingComparison.day.formatted.avgGap,
            },
          ]}
          insight={
            nightVsDayFeedingComparison.night.count > 0
              ? `Average ${(nightVsDayFeedingComparison.night.count / 7).toFixed(1)} night feedings per night`
              : undefined
          }
          nightStats={[
            {
              label: 'Count',
              value: nightVsDayFeedingComparison.night.formatted.count,
            },
            {
              label: 'Total Amount',
              value: nightVsDayFeedingComparison.night.formatted.total,
            },
            {
              label: 'Avg Amount',
              value: nightVsDayFeedingComparison.night.formatted.avgAmount,
            },
            {
              label: 'Avg Gap',
              value: nightVsDayFeedingComparison.night.formatted.avgGap,
            },
          ]}
          timePeriod={statCardsTimePeriod}
          title="Night vs Day Feeding"
        />

        {/* Night vs Day Feeding Trend Chart */}
        <Card className="p-4">
          <div className="mb-3 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Night vs Day Feeding Trend
                </h3>
                <p className="text-xs text-muted-foreground">
                  {dateRangeLabel}
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
          <NightDayTrendChart
            dayData={nightVsDayTrendData.dayTrendData}
            metricType="count"
            nightData={nightVsDayTrendData.nightTrendData}
            timeRange={trendTimeRange}
          />
        </Card>
      </div>

      {/* Count Trend Chart */}
      <Card className="p-4">
        <div className="mb-3 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Feeding Count
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

              {/* Total/Average Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    {countAmountType === 'total' ? 'Total' : 'Average'}
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setCountAmountType('total')}>
                    Total
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Night/Day/All Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    {trendTimePeriod === 'all'
                      ? 'All'
                      : trendTimePeriod === 'night'
                        ? 'Night'
                        : 'Day'}
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTrendTimePeriod('all')}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimePeriod('night')}>
                    Night
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimePeriod('day')}>
                    Day
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <FeedingTrendChart
          amountType={countAmountType}
          dailyGoal={dailyCountGoal ?? null}
          data={dynamicTrendData}
          goalSeries={countGoalSeries}
          metricType="count"
          timeRange={trendTimeRange}
          unit={unit}
        />
      </Card>

      {/* Amount Trend Chart */}
      <Card className="p-4">
        <div className="mb-3 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Feeding Amount
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

              {/* Total/Average Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    {amountAmountType === 'total' ? 'Total' : 'Average'}
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setAmountAmountType('total')}
                  >
                    Total
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setAmountAmountType('average')}
                  >
                    Average
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Night/Day/All Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    {trendTimePeriod === 'all'
                      ? 'All'
                      : trendTimePeriod === 'night'
                        ? 'Night'
                        : 'Day'}
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTrendTimePeriod('all')}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimePeriod('night')}>
                    Night
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTrendTimePeriod('day')}>
                    Day
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <FeedingTrendChart
          amountType={amountAmountType}
          dailyGoal={
            amountAmountType === 'total' && dailyAmountGoal
              ? dailyAmountGoal
              : null
          }
          data={dynamicTrendData}
          goalSeries={
            amountAmountType === 'total' ? amountGoalSeries : undefined
          }
          metricType="amount"
          timeRange={trendTimeRange}
          unit={unit}
        />
      </Card>

      {/* Timeline Card */}
      <Card className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              When feedings happen
            </h3>
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
          </div>
        </div>
        <TimeBlockChart
          colorVar="var(--activity-feeding)"
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
                  {heatmapMetric === 'count' ? 'Count' : 'Amount'}
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setHeatmapMetric('count')}>
                  Count
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setHeatmapMetric('amount')}>
                  Amount
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <FrequencyHeatmap
          colorVar="var(--activity-feeding)"
          data={frequencyHeatmapData}
          metric={heatmapMetric}
          timeFormat={timeFormat}
          unit={heatmapMetric === 'amount' ? unit : undefined}
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
          activityLabel="feedings"
          colorVar="var(--activity-feeding)"
          insights={frequencyInsights}
          timeFormat={timeFormat}
        />
      </Card>

      {/* Recent Activities Section */}
      {recentActivitiesWithSide.length > 0 && (
        <Card className="p-4">
          <RecentActivitiesList
            activities={recentActivitiesWithSide}
            activityType="feeding"
            timeFormat={timeFormat}
            title="Feeding"
            unit={unit}
          />
        </Card>
      )}
    </StatsDrawerWrapper>
  );
}
