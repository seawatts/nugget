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
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
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
  MetricType,
  TrendData,
} from '../../shared/types';
import { TIME_RANGE_OPTIONS } from '../../shared/types';
import {
  calculateHourlyFrequency,
  calculateTimeBlockData,
  detectPatterns,
} from '../../shared/utils/frequency-utils';
import { mlToOz } from '../../shared/volume-utils';
import { calculatePumpingStatsWithComparison } from '../pumping-goals';
import { PumpingTrendChart } from './pumping-trend-chart';

interface PumpingStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trendData: TrendData[];
  activities: Array<typeof Activities.$inferSelect>; // Raw activities for dynamic stats calculation
  unit: 'ML' | 'OZ';
  recentActivities: Array<{
    time: Date;
    amountMl?: number;
    [key: string]: unknown;
  }>;
  timeFormat: '12h' | '24h';
}

export function PumpingStatsDrawer({
  open,
  onOpenChange,
  trendData,
  activities,
  unit,
  recentActivities,
  timeFormat,
}: PumpingStatsDrawerProps) {
  const [metricType, setMetricType] = useState<MetricType>('count');
  const [amountType, setAmountType] = useState<AmountType>('total');
  const [timeRange, setTimeRange] = useState<ComparisonTimeRange>('24h');
  const [timelineMetric, setTimelineMetric] = useState<'count' | 'amount'>(
    'count',
  );
  const [heatmapMetric, setHeatmapMetric] = useState<'count' | 'amount'>(
    'count',
  );

  const handleMetricTypeChange = (newType: MetricType) => {
    setMetricType(newType);
    // Reset to 'total' when switching to 'count'
    if (newType === 'count' && amountType === 'average') {
      setAmountType('total');
    }
  };

  // Calculate stats based on selected time range
  const statsComparison = useMemo(() => {
    const selectedRange = TIME_RANGE_OPTIONS.find(
      (opt) => opt.value === timeRange,
    );
    return calculatePumpingStatsWithComparison(
      activities,
      selectedRange?.hours ?? 24,
    );
  }, [activities, timeRange]);

  const trendContent = getTrendContent('pumping', metricType);
  const selectedRangeHours =
    TIME_RANGE_OPTIONS.find((opt) => opt.value === timeRange)?.hours ?? 24;
  const comparisonContent = getComparisonContent(timeRange, selectedRangeHours);

  // Calculate frequency data
  const pumpingActivities = useMemo(
    () => activities.filter((a) => a.type === 'pumping'),
    [activities],
  );

  const frequencyHeatmapData = useMemo(
    () => calculateHourlyFrequency(pumpingActivities),
    [pumpingActivities],
  );

  const timeBlockData = useMemo(
    () => calculateTimeBlockData(pumpingActivities, 7),
    [pumpingActivities],
  );

  const frequencyInsights = useMemo(
    () => detectPatterns(pumpingActivities),
    [pumpingActivities],
  );

  const formatAmount = (ml: number) => {
    if (unit === 'OZ') {
      return mlToOz(ml);
    }
    return Math.round(ml);
  };

  const comparisonData: ComparisonData[] = [
    {
      current: statsComparison.current.count,
      metric: 'Sessions',
      previous: statsComparison.previous.count,
    },
  ];

  if (statsComparison.current.totalMl !== undefined) {
    comparisonData.push({
      current:
        unit === 'OZ'
          ? formatAmount(statsComparison.current.totalMl)
          : statsComparison.current.totalMl,
      metric: `Total (${unit.toLowerCase()})`,
      previous:
        unit === 'OZ'
          ? formatAmount(statsComparison.previous.totalMl ?? 0)
          : (statsComparison.previous.totalMl ?? 0),
    });
  }

  if (statsComparison.current.avgAmountMl !== undefined) {
    comparisonData.push({
      current:
        statsComparison.current.avgAmountMl !== null &&
        statsComparison.current.avgAmountMl !== undefined
          ? unit === 'OZ'
            ? formatAmount(statsComparison.current.avgAmountMl)
            : statsComparison.current.avgAmountMl
          : 0,
      metric: `Avg (${unit.toLowerCase()})`,
      previous:
        statsComparison.previous.avgAmountMl !== null &&
        statsComparison.previous.avgAmountMl !== undefined
          ? unit === 'OZ'
            ? formatAmount(statsComparison.previous.avgAmountMl)
            : statsComparison.previous.avgAmountMl
          : 0,
    });
  }

  return (
    <StatsDrawerWrapper
      onOpenChange={onOpenChange}
      open={open}
      title="Pumping Statistics"
    >
      {/* Trend Chart Section */}
      <Card className="p-4">
        <div className="mb-3 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                {trendContent.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {trendContent.description}
              </p>
            </div>
            <div className="flex gap-2">
              {/* Metric Type Dropdown */}
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

              {/* Total/Average Dropdown */}
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
        </div>
        <PumpingTrendChart
          amountType={amountType}
          data={trendData}
          metricType={metricType as 'count' | 'amount'}
          unit={unit}
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
          colorClass="var(--activity-pumping)"
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
              When sessions occur throughout the day
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
