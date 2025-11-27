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
import type {
  AmountType,
  HeatmapRangeValue,
  TimelineWeekRange,
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
import {
  getAgeDaysForDate,
  normalizeGoalContext,
} from '../../shared/utils/goal-utils';
import {
  calculateFeedingTrendData,
  getDailyAmountGoal,
  getDailyFeedingGoal,
} from '../feeding-goals';
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

  // Calculate trend data based on selected time range
  const dynamicTrendData = useMemo(
    () => calculateFeedingTrendData(activities, trendTimeRange),
    [activities, trendTimeRange],
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

      return {
        amount: getDailyAmountGoal(
          ageDays,
          unit,
          normalizedGoalContext.predictedIntervalHours ?? undefined,
          normalizedGoalContext.dataPointsCount,
        ),
        count: getDailyFeedingGoal(
          ageDays,
          normalizedGoalContext.predictedIntervalHours ?? undefined,
          normalizedGoalContext.dataPointsCount,
        ),
      };
    });
  }, [dynamicTrendData, normalizedGoalContext, unit]);

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
    () => calculateHourlyFrequency(heatmapFeedingActivities),
    [heatmapFeedingActivities],
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

  return (
    <StatsDrawerWrapper
      onOpenChange={onOpenChange}
      open={open}
      title="Feeding Statistics"
    >
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
