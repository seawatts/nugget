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
  VitaminDDay,
} from '../../shared/types';
import { mlToOz } from '../../shared/volume-utils';
import { FeedingTrendChart } from './feeding-trend-chart';
import { VitaminDTracker } from './vitamin-d-tracker';

interface FeedingStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trendData: TrendData[];
  statsComparison: StatsComparison;
  unit: 'ML' | 'OZ';
  vitaminDData?: VitaminDDay[];
}

export function FeedingStatsDrawer({
  open,
  onOpenChange,
  trendData,
  statsComparison,
  unit,
  vitaminDData,
}: FeedingStatsDrawerProps) {
  const [metricType, setMetricType] = useState<MetricType>('count');
  const [amountType, setAmountType] = useState<AmountType>('total');

  const trendContent = getTrendContent('feeding', metricType);
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
            <MetricControls
              activityType="feeding"
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
        <FeedingTrendChart
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
          colorClass="var(--activity-feeding)"
          data={comparisonData}
        />
      </Card>
    </StatsDrawerWrapper>
  );
}
