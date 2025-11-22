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
  StatsComparison,
  TrendData,
} from '../../shared/types';
import { mlToOz } from '../../shared/volume-utils';
import { PumpingTrendChart } from './pumping-trend-chart';

interface PumpingStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trendData: TrendData[];
  statsComparison: StatsComparison;
  unit: 'ML' | 'OZ';
}

export function PumpingStatsDrawer({
  open,
  onOpenChange,
  trendData,
  statsComparison,
  unit,
}: PumpingStatsDrawerProps) {
  const [metricType, setMetricType] = useState<MetricType>('count');
  const [amountType, setAmountType] = useState<AmountType>('total');

  const trendContent = getTrendContent('pumping', metricType);
  const comparisonContent = getComparisonContent();

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
            <MetricControls
              activityType="pumping"
              amountType={amountType}
              labels={{
                firstMetric: 'Count',
                secondMetric: 'Amount',
              }}
              metricType={metricType}
              onAmountTypeChange={setAmountType}
              onMetricTypeChange={setMetricType}
            />
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
        <div className="mb-3">
          <h3 className="text-sm font-medium text-foreground">
            {comparisonContent.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {comparisonContent.description}
          </p>
        </div>
        <ComparisonChart
          colorClass="var(--activity-pumping)"
          data={comparisonData}
        />
      </Card>
    </StatsDrawerWrapper>
  );
}
