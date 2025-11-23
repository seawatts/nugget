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
  TrendData,
} from '../../shared/types';
import { TIME_RANGE_OPTIONS } from '../../shared/types';
import { calculateDiaperStatsWithComparison } from '../diaper-goals';
import { DiaperTrendChart } from './diaper-trend-chart';

type DiaperMetricType = 'total' | 'wet' | 'dirty' | 'both';

interface DiaperStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trendData: TrendData[];
  activities: Array<typeof Activities.$inferSelect>; // Raw activities for dynamic stats calculation
}

export function DiaperStatsDrawer({
  open,
  onOpenChange,
  trendData,
  activities,
}: DiaperStatsDrawerProps) {
  const [metricType, setMetricType] = useState<DiaperMetricType>('total');
  const [amountType, setAmountType] = useState<AmountType>('total');
  const [timeRange, setTimeRange] = useState<ComparisonTimeRange>('24h');

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
  const comparisonContent = getComparisonContent(timeRange);

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
          data={comparisonData}
        />
      </Card>
    </StatsDrawerWrapper>
  );
}
