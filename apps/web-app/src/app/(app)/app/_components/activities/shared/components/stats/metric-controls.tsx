'use client';

import { Button } from '@nugget/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nugget/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import type { ActivityType, AmountType, MetricType } from '../../types';

interface MetricControlsProps {
  activityType: ActivityType;
  metricType: MetricType;
  amountType: AmountType;
  onMetricTypeChange: (type: MetricType) => void;
  onAmountTypeChange: (type: AmountType) => void;
  labels: {
    firstMetric: string;
    secondMetric: string;
  };
}

export function MetricControls({
  activityType,
  metricType,
  amountType,
  onMetricTypeChange,
  onAmountTypeChange,
  labels,
}: MetricControlsProps) {
  const handleMetricChange = (newMetricType: MetricType) => {
    onMetricTypeChange(newMetricType);
    // Reset to total when switching to count for sleep, pumping, or feeding
    if (
      newMetricType === 'count' &&
      (activityType === 'sleep' ||
        activityType === 'pumping' ||
        activityType === 'feeding') &&
      amountType === 'average'
    ) {
      onAmountTypeChange('total');
    }
  };

  const shouldShowDropdown =
    metricType === 'amount' ||
    metricType === 'hours' ||
    (metricType === 'count' &&
      (activityType === 'sleep' ||
        activityType === 'pumping' ||
        activityType === 'feeding'));

  const shouldHideAverage =
    metricType === 'count' &&
    (activityType === 'sleep' ||
      activityType === 'pumping' ||
      activityType === 'feeding');

  return (
    <div className="flex gap-2">
      <div className="flex gap-1">
        <Button
          onClick={() => handleMetricChange('count')}
          size="sm"
          variant={metricType === 'count' ? 'default' : 'outline'}
        >
          {labels.firstMetric}
        </Button>
        <Button
          onClick={() =>
            handleMetricChange(activityType === 'sleep' ? 'hours' : 'amount')
          }
          size="sm"
          variant={
            metricType === 'amount' || metricType === 'hours'
              ? 'default'
              : 'outline'
          }
        >
          {labels.secondMetric}
        </Button>
      </div>
      {shouldShowDropdown && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              {amountType === 'total' ? 'Total' : 'Avg'}
              <ChevronDown className="ml-1 size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAmountTypeChange('total')}>
              Total
            </DropdownMenuItem>
            {!shouldHideAverage && (
              <DropdownMenuItem onClick={() => onAmountTypeChange('average')}>
                Average
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
