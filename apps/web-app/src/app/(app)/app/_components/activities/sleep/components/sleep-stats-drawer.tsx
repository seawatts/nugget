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
  getComparisonContent,
  getTrendContent,
  StatsDrawerWrapper,
} from '../../shared/components/stats';
import type {
  AmountType,
  ComparisonData,
  ComparisonTimeRange,
  MetricType,
  TrendData,
} from '../../shared/types';
import { TIME_RANGE_OPTIONS } from '../../shared/types';
import { calculateSleepStatsWithComparison } from '../sleep-goals';
import { SleepTrendChart } from './sleep-trend-chart';

interface SleepStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trendData: TrendData[];
  activities: Array<typeof Activities.$inferSelect>; // Raw activities for dynamic stats calculation
}

export function SleepStatsDrawer({
  open,
  onOpenChange,
  trendData,
  activities,
}: SleepStatsDrawerProps) {
  const [metricType, setMetricType] = useState<MetricType>('count');
  const [amountType, setAmountType] = useState<AmountType>('total');
  const [timeRange, setTimeRange] = useState<ComparisonTimeRange>('24h');

  const handleMetricTypeChange = (newType: MetricType) => {
    setMetricType(newType);
    // Reset to 'total' when switching to 'count' (Naps)
    if (newType === 'count' && amountType === 'average') {
      setAmountType('total');
    }
  };

  // Calculate stats based on selected time range
  const statsComparison = useMemo(() => {
    const selectedRange = TIME_RANGE_OPTIONS.find(
      (opt) => opt.value === timeRange,
    );
    return calculateSleepStatsWithComparison(
      activities,
      selectedRange?.hours ?? 24,
    );
  }, [activities, timeRange]);

  const trendContent = getTrendContent('sleep', metricType);
  const comparisonContent = getComparisonContent(timeRange);

  const comparisonData: ComparisonData[] = [
    {
      current: statsComparison.current.napCount,
      metric: 'Naps',
      previous: statsComparison.previous.napCount,
    },
    {
      current: Number((statsComparison.current.totalMinutes / 60).toFixed(1)),
      metric: 'Total (h)',
      previous: Number((statsComparison.previous.totalMinutes / 60).toFixed(1)),
    },
    {
      current: statsComparison.current.avgNapDuration
        ? Number((statsComparison.current.avgNapDuration / 60).toFixed(1))
        : 0,
      metric: 'Avg Nap (h)',
      previous: statsComparison.previous.avgNapDuration
        ? Number((statsComparison.previous.avgNapDuration / 60).toFixed(1))
        : 0,
    },
  ];

  return (
    <StatsDrawerWrapper
      onOpenChange={onOpenChange}
      open={open}
      title="Sleep Statistics"
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
                    {metricType === 'count' ? 'Naps' : 'Hours'}
                    <ChevronDown className="ml-1 size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleMetricTypeChange('count')}
                  >
                    Naps
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleMetricTypeChange('hours')}
                  >
                    Hours
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
        <SleepTrendChart
          amountType={amountType}
          data={trendData}
          metricType={metricType as 'count' | 'hours'}
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
          colorClass="var(--activity-sleep)"
          data={comparisonData}
        />
      </Card>
    </StatsDrawerWrapper>
  );
}
