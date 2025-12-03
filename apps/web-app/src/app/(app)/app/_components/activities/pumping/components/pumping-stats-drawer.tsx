'use client';

import { DASHBOARD_COMPONENT } from '@nugget/analytics/utils';
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
  getTrendContent,
  NumericStatCard,
  RecentActivitiesList,
  StatsDrawerWrapper,
  TimeBlockChart,
} from '../../shared/components/stats';
import type {
  AmountType,
  HeatmapRangeValue,
  MetricType,
  StatMetricType,
  StatPivotPeriod,
  StatTimePeriod,
  TimelineWeekRange,
  TrendTimeRange,
} from '../../shared/types';
import {
  getPivotPeriodOptionsForTimePeriod,
  HEATMAP_RANGE_OPTIONS,
  STAT_TIME_PERIOD_OPTIONS,
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
import { getDateRangeLabelForPeriod } from '../../shared/utils/stat-calculations';
import { calculatePumpingTrendData } from '../pumping-goals';
import { calculatePumpingStat } from '../pumping-stat-calculations';
import { PumpingTrendChart } from './pumping-trend-chart';

interface PumpingStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: Array<typeof Activities.$inferSelect>;
  unit: 'ML' | 'OZ';
  recentActivities: Array<{
    time: Date;
    amountMl?: number;
    [key: string]: unknown;
  }>;
  timeFormat: '12h' | '24h';
}

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

export function PumpingStatsDrawer({
  open,
  onOpenChange,
  activities,
  unit,
  recentActivities,
  timeFormat,
}: PumpingStatsDrawerProps) {
  // Extract babyId from activities for tracking
  const babyId = activities[0]?.babyId;
  const [trendTimeRange, setTrendTimeRange] = useState<TrendTimeRange>('7d');
  const [metricType, setMetricType] = useState<MetricType>('count');
  const [amountType, setAmountType] = useState<AmountType>('total');
  const [timelineMetric, setTimelineMetric] = useState<'count' | 'amount'>(
    'count',
  );
  const [heatmapMetric, setHeatmapMetric] = useState<'count' | 'amount'>(
    'count',
  );
  const [heatmapRange, setHeatmapRange] = useState<HeatmapRangeValue>('30d');
  const [statCardsTimePeriod, setStatCardsTimePeriod] =
    useState<StatTimePeriod>('this_week');
  const [statCardsPivotPeriod, setStatCardsPivotPeriod] =
    useState<StatPivotPeriod>('total');
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

  const handleMetricTypeChange = (newType: MetricType) => {
    setMetricType(newType);
    // Reset to 'total' when switching to 'count'
    if (newType === 'count' && amountType === 'average') {
      setAmountType('total');
    }
  };

  const trendContent = getTrendContent('pumping', metricType);
  const trendDateRangeLabel = useMemo(
    () => getDateRangeLabel(trendTimeRange),
    [trendTimeRange],
  );
  const dynamicTrendData = useMemo(
    () => calculatePumpingTrendData(activities, trendTimeRange),
    [activities, trendTimeRange],
  );

  // Calculate frequency data
  const pumpingActivities = useMemo(
    () => activities.filter((a) => a.type === 'pumping'),
    [activities],
  );

  // Filter for heatmap range
  const heatmapPumpingActivities = useMemo(() => {
    const cutoff = subDays(new Date(), selectedHeatmapOption.days);
    return pumpingActivities.filter(
      (activity) => new Date(activity.startTime) >= cutoff,
    );
  }, [pumpingActivities, selectedHeatmapOption]);

  const frequencyHeatmapData = useMemo(
    () => calculateHourlyFrequency(heatmapPumpingActivities),
    [heatmapPumpingActivities],
  );
  const heatmapDateRangeLabel = useMemo(
    () => getCustomDateRangeLabel(selectedHeatmapOption.days),
    [selectedHeatmapOption.days],
  );

  const timeBlockData = useMemo(
    () => calculateTimeBlockData(pumpingActivities, 7, timelineOffsetDays),
    [pumpingActivities, timelineOffsetDays],
  );

  const frequencyInsights = useMemo(
    () => detectPatterns(pumpingActivities),
    [pumpingActivities],
  );

  const timelineDateRangeLabel = useMemo(
    () => getDateRangeLabel('7d', new Date(), timelineOffsetDays),
    [timelineOffsetDays],
  );

  // Create calculate function for NumericStatCard
  const calculatePumpingStatForCard = useMemo(
    () => (metric: StatMetricType, timePeriod: StatTimePeriod) =>
      calculatePumpingStat(
        activities,
        metric,
        timePeriod,
        unit,
        statCardsPivotPeriod,
      ),
    [activities, unit, statCardsPivotPeriod],
  );

  return (
    <StatsDrawerWrapper
      babyId={babyId}
      componentName={DASHBOARD_COMPONENT.PUMPING_STATS_DRAWER}
      onOpenChange={onOpenChange}
      open={open}
      title="Pumping Statistics"
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

        {/* 2x2 Grid of Stat Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Pumping Sessions Count Card */}
          <NumericStatCard
            availableMetrics={['count']}
            calculateStat={calculatePumpingStatForCard}
            defaultMetric="count"
            showDateRange={false}
            timePeriod={statCardsTimePeriod}
          />

          {/* Total Amount Card with Average Amount underneath */}
          <Card className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-foreground">
                {
                  calculatePumpingStatForCard('total', statCardsTimePeriod)
                    .label
                }
              </h3>
            </div>
            <div className="mt-4 space-y-2">
              <div>
                <div className="text-3xl font-bold text-foreground">
                  {
                    calculatePumpingStatForCard('total', statCardsTimePeriod)
                      .formattedValue
                  }
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Avg:{' '}
                  {
                    calculatePumpingStatForCard('average', statCardsTimePeriod)
                      .formattedValue
                  }
                </div>
              </div>
            </div>
          </Card>

          {/* Average Duration Card */}
          <NumericStatCard
            availableMetrics={['duration']}
            calculateStat={calculatePumpingStatForCard}
            defaultMetric="duration"
            showDateRange={false}
            timePeriod={statCardsTimePeriod}
          />
        </div>
      </div>
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

          <div className="flex gap-2">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  {metricType === 'count' ? 'Count' : 'Amount'}
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleMetricTypeChange('count')}
                >
                  Count
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleMetricTypeChange('amount')}
                >
                  Amount
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  {amountType === 'total' ? 'Total' : 'Average'}
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setAmountType('total')}>
                  Total
                </DropdownMenuItem>
                {metricType !== 'count' && (
                  <DropdownMenuItem onClick={() => setAmountType('average')}>
                    Average
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <PumpingTrendChart
          amountType={amountType}
          data={dynamicTrendData}
          metricType={metricType as 'count' | 'amount'}
          unit={unit}
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
        </div>

        <TimeBlockChart
          colorVar="var(--activity-pumping)"
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
          colorVar="var(--activity-pumping)"
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
          activityLabel="pumping sessions"
          colorVar="var(--activity-pumping)"
          insights={frequencyInsights}
          timeFormat={timeFormat}
        />
      </Card>

      {/* Recent Activities Section */}
      {recentActivities.length > 0 && (
        <Card className="p-4">
          <RecentActivitiesList
            activities={recentActivities}
            activityType="pumping"
            timeFormat={timeFormat}
            title="Pumping"
            unit={unit}
          />
        </Card>
      )}
    </StatsDrawerWrapper>
  );
}
