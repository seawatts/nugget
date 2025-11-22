'use client';

import { Card } from '@nugget/ui/card';
import { useState } from 'react';
import {
  ComparisonChart,
  getComparisonContent,
  getTrendContent,
  MetricControls,
  StatsDrawerWrapper,
} from '../../shared/components/stats';
import type {
  AmountType,
  ComparisonData,
  MetricType,
  SleepStatsComparison,
  TrendData,
} from '../../shared/types';
import { SleepTrendChart } from './sleep-trend-chart';

interface SleepStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trendData: TrendData[];
  statsComparison: SleepStatsComparison;
}

export function SleepStatsDrawer({
  open,
  onOpenChange,
  trendData,
  statsComparison,
}: SleepStatsDrawerProps) {
  const [metricType, setMetricType] = useState<MetricType>('count');
  const [amountType, setAmountType] = useState<AmountType>('total');

  const trendContent = getTrendContent('sleep', metricType);
  const comparisonContent = getComparisonContent();

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
            <MetricControls
              activityType="sleep"
              amountType={amountType}
              labels={{
                firstMetric: 'Naps',
                secondMetric: 'Hours',
              }}
              metricType={metricType}
              onAmountTypeChange={setAmountType}
              onMetricTypeChange={setMetricType}
            />
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
        <div className="mb-3">
          <h3 className="text-sm font-medium text-foreground">
            {comparisonContent.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {comparisonContent.description}
          </p>
        </div>
        <ComparisonChart
          colorClass="var(--activity-sleep)"
          data={comparisonData}
        />
      </Card>
    </StatsDrawerWrapper>
  );
}
