'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nugget/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import {
  ComparisonChart,
  getComparisonContent,
  getTrendContent,
  StatsDrawerWrapper,
} from '../../shared/components/stats';
import type {
  AmountType,
  ComparisonData,
  DiaperStatsComparison,
  TrendData,
} from '../../shared/types';
import { DiaperTrendChart } from './diaper-trend-chart';

type DiaperMetricType = 'total' | 'wet' | 'dirty' | 'both';

interface DiaperStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trendData: TrendData[];
  statsComparison: DiaperStatsComparison;
}

export function DiaperStatsDrawer({
  open,
  onOpenChange,
  trendData,
  statsComparison,
}: DiaperStatsDrawerProps) {
  const [metricType, setMetricType] = useState<DiaperMetricType>('total');
  const [amountType, setAmountType] = useState<AmountType>('total');

  const trendContent = getTrendContent('diaper');
  const comparisonContent = getComparisonContent();

  const getMetricLabel = (type: DiaperMetricType) => {
    switch (type) {
      case 'total':
        return 'Total';
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
      metric: 'Total',
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
                    Total
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
        <div className="mb-3">
          <h3 className="text-sm font-medium text-foreground">
            {comparisonContent.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {comparisonContent.description}
          </p>
        </div>
        <ComparisonChart
          colorClass="var(--activity-diaper)"
          data={comparisonData}
        />
      </Card>
    </StatsDrawerWrapper>
  );
}
