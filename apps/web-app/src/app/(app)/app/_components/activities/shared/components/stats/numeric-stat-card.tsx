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
import { useMemo, useState } from 'react';
import type { StatMetricType, StatTimePeriod } from '../../types';
import { STAT_TIME_PERIOD_OPTIONS } from '../../types';
import { getDateRangeLabelForPeriod } from '../../utils/stat-calculations';

interface NumericStatCardProps {
  /**
   * Available metrics for this card
   */
  availableMetrics: StatMetricType[];
  /**
   * Function to calculate and format the stat value
   */
  calculateStat: (
    metric: StatMetricType,
    timePeriod: StatTimePeriod,
  ) => {
    value: number | null;
    formattedValue: string;
    label: string;
  };
  /**
   * Default metric to show
   */
  defaultMetric?: StatMetricType;
  /**
   * Time period to use (controlled from parent)
   */
  timePeriod: StatTimePeriod;
  /**
   * Whether to show the time period dropdown (default: true)
   */
  showTimePeriodDropdown?: boolean;
  /**
   * Callback when time period changes (only used if showTimePeriodDropdown is true)
   */
  onTimePeriodChange?: (timePeriod: StatTimePeriod) => void;
  /**
   * Whether to show the date range subtitle (default: true)
   */
  showDateRange?: boolean;
  /**
   * Custom label for the metric dropdown
   */
  metricLabel?: string;
  /**
   * Custom label for the time period dropdown
   */
  timePeriodLabel?: string;
}

const METRIC_LABELS: Record<StatMetricType, string> = {
  amount: 'Amount',
  average: 'Average',
  count: 'Count',
  duration: 'Duration',
  total: 'Total',
};

// Fallback options in case import fails
const FALLBACK_TIME_PERIOD_OPTIONS: Array<{
  value: StatTimePeriod;
  label: string;
  days: number;
}> = [
  { days: 7, label: 'This Week', value: 'this_week' },
  { days: 7, label: 'Last Week', value: 'last_week' },
  { days: 14, label: 'Last 2 Weeks', value: 'last_2_weeks' },
  { days: 30, label: 'Last Month', value: 'last_month' },
  { days: 90, label: 'Last 3 Months', value: 'last_3_months' },
  { days: 180, label: 'Last 6 Months', value: 'last_6_months' },
];

export function NumericStatCard({
  availableMetrics,
  calculateStat,
  defaultMetric = 'count',
  timePeriod,
  showTimePeriodDropdown = false,
  onTimePeriodChange,
  showDateRange = true,
  metricLabel: _metricLabel = 'Metric',
  timePeriodLabel: _timePeriodLabel = 'Period',
}: NumericStatCardProps) {
  const [selectedMetric, setSelectedMetric] =
    useState<StatMetricType>(defaultMetric);

  const statResult = useMemo(
    () => calculateStat(selectedMetric, timePeriod),
    [calculateStat, selectedMetric, timePeriod],
  );

  const timePeriodOptions =
    STAT_TIME_PERIOD_OPTIONS || FALLBACK_TIME_PERIOD_OPTIONS;

  const selectedTimePeriodOption = useMemo(() => {
    return (
      timePeriodOptions.find((option) => option.value === timePeriod) ??
      timePeriodOptions[0]
    );
  }, [timePeriod, timePeriodOptions]);

  const dateRangeLabel = useMemo(
    () => getDateRangeLabelForPeriod(timePeriod),
    [timePeriod],
  );

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-foreground">
            {statResult.label}
          </h3>
          {showDateRange && (
            <p className="text-xs text-muted-foreground">{dateRangeLabel}</p>
          )}
        </div>
        <div className="flex gap-2">
          {/* Metric Dropdown - Only show if more than one metric available */}
          {availableMetrics.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  {METRIC_LABELS[selectedMetric]}
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableMetrics.map((metric) => (
                  <DropdownMenuItem
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                  >
                    {METRIC_LABELS[metric]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Time Period Dropdown - Only show if enabled */}
          {showTimePeriodDropdown && onTimePeriodChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  {selectedTimePeriodOption.label}
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {timePeriodOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onTimePeriodChange(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Stat Value Display */}
      <div className="mt-4">
        <div className="text-3xl font-bold text-foreground">
          {statResult.formattedValue}
        </div>
      </div>
    </Card>
  );
}
