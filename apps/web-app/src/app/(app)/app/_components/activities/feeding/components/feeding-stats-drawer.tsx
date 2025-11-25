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
import { format, subDays } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  FrequencyHeatmap,
  FrequencyInsightsComponent,
  RecentActivitiesList,
  StatsDrawerWrapper,
  TimeBlockChart,
} from '../../shared/components/stats';
import type { AmountType } from '../../shared/types';
import {
  calculateHourlyFrequency,
  calculateTimeBlockData,
  detectPatterns,
} from '../../shared/utils/frequency-utils';
import { calculateFeedingTrendData } from '../feeding-goals';
import { FeedingTrendChart } from './feeding-trend-chart';

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
}

export function FeedingStatsDrawer({
  open,
  onOpenChange,
  activities,
  unit,
  recentActivities,
  timeFormat,
}: FeedingStatsDrawerProps) {
  const [trendTimeRange, setTrendTimeRange] = useState<
    '24h' | '7d' | '2w' | '1m' | '3m' | '6m'
  >('7d');
  const [countAmountType, setCountAmountType] = useState<AmountType>('total');
  const [amountAmountType, setAmountAmountType] = useState<AmountType>('total');
  const [timelineMetric, setTimelineMetric] = useState<'count' | 'amount'>(
    'count',
  );
  const [heatmapMetric, setHeatmapMetric] = useState<'count' | 'amount'>(
    'count',
  );

  // Calculate trend data based on selected time range
  const dynamicTrendData = useMemo(
    () => calculateFeedingTrendData(activities, trendTimeRange),
    [activities, trendTimeRange],
  );

  // Calculate frequency data
  const feedingActivities = useMemo(
    () => activities.filter((a) => a.type === 'feeding'),
    [activities],
  );

  // Filter to last 30 days for heatmap
  const last30DaysFeedingActivities = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    return feedingActivities.filter(
      (activity) => new Date(activity.startTime) >= thirtyDaysAgo,
    );
  }, [feedingActivities]);

  const frequencyHeatmapData = useMemo(
    () => calculateHourlyFrequency(last30DaysFeedingActivities),
    [last30DaysFeedingActivities],
  );

  const timeBlockData = useMemo(
    () => calculateTimeBlockData(feedingActivities, 7),
    [feedingActivities],
  );

  const frequencyInsights = useMemo(
    () => detectPatterns(feedingActivities),
    [feedingActivities],
  );

  // Calculate the date range for display based on selected time range
  const dateRangeText = useMemo(() => {
    const now = new Date();
    const daysMap: Record<string, number> = {
      '1m': 30,
      '2w': 14,
      '3m': 90,
      '6m': 180,
      '7d': 7,
      '24h': 1,
    };
    const days = daysMap[trendTimeRange] ?? 7;
    const startDate = subDays(now, days);
    const endDate = now;

    return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`;
  }, [trendTimeRange]);

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
              <p className="text-xs text-muted-foreground">{dateRangeText}</p>
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
          data={dynamicTrendData}
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
              <p className="text-xs text-muted-foreground">
                Volume consumed over time
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
          data={dynamicTrendData}
          metricType="amount"
          timeRange={trendTimeRange}
          unit={unit}
        />
      </Card>

      {/* Timeline Card */}
      <Card className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Timeline</h3>
            <p className="text-xs text-muted-foreground">
              When feedings occur throughout the day
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                {timelineMetric === 'count' ? 'Count' : 'Amount'}
                <ChevronDown className="ml-1 size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTimelineMetric('count')}>
                Count
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimelineMetric('amount')}>
                Amount
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              Frequency patterns by day and time
            </p>
          </div>
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
      {recentActivities.length > 0 && (
        <Card className="p-4">
          <RecentActivitiesList
            activities={recentActivities}
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
