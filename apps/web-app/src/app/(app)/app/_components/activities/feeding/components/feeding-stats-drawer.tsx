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
  VitaminDDay,
} from '../../shared/types';
import { TIME_RANGE_OPTIONS } from '../../shared/types';
import { mlToOz } from '../../shared/volume-utils';
import { calculateFeedingStatsWithComparison } from '../feeding-goals';
import { FeedingTrendChart } from './feeding-trend-chart';
import { VitaminDTracker } from './vitamin-d-tracker';

interface FeedingStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trendData: TrendData[];
  activities: Array<typeof Activities.$inferSelect>; // Raw activities for dynamic stats calculation
  unit: 'ML' | 'OZ';
  vitaminDData?: VitaminDDay[];
}

export function FeedingStatsDrawer({
  open,
  onOpenChange,
  trendData,
  activities,
  unit,
  vitaminDData,
}: FeedingStatsDrawerProps) {
  const [metricType, setMetricType] = useState<MetricType>('count');
  const [amountType, setAmountType] = useState<AmountType>('total');
  const [timeRange, setTimeRange] = useState<ComparisonTimeRange>('24h');

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
    return calculateFeedingStatsWithComparison(
      activities,
      selectedRange?.hours ?? 24,
    );
  }, [activities, timeRange]);

  const trendContent = getTrendContent('feeding', metricType);
  const comparisonContent = getComparisonContent(timeRange);

  const formatAmount = (ml: number) => {
    if (unit === 'OZ') {
      return mlToOz(ml);
    }
    return Math.round(ml);
  };

  const comparisonData: ComparisonData[] = [
    {
      current: statsComparison.current.count,
      metric: 'Feedings',
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
      title="Feeding Statistics"
    >
      {/* Vitamin D Tracking */}
      {vitaminDData && vitaminDData.length > 0 && (
        <Card className="p-4">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-foreground">
              Vitamin D - Last 7 Days
            </h3>
            <p className="text-xs text-muted-foreground">
              Daily supplement tracking
            </p>
          </div>
          <VitaminDTracker days={vitaminDData} />
        </Card>
      )}

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
        <FeedingTrendChart
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
          colorClass="var(--activity-feeding)"
          data={comparisonData}
        />
      </Card>
    </StatsDrawerWrapper>
  );
}
